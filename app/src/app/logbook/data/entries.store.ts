import { computed, effect, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthStore } from '@app-shared/auth/data/auth.store';
import { createLogger } from '@app-shared/logger';
import {
  EmptyEntriesFilters,
  EmptyPageCursor,
  EntriesFilters,
  EntryDoc,
  PageCursor,
} from '@app-shared/models';
import { tapResponse } from '@ngrx/operators';
import {
  getState,
  patchState,
  signalStore,
  type,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  entityConfig,
  removeAllEntities,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  EMPTY,
  Observable,
  combineLatestWith,
  distinctUntilChanged,
  finalize,
  map,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { EntriesService } from './db/entries.service';

const PAGE_SIZE = 2;

type DisconnectedState = {
  status: 'disconnected';
  currentPage: null;
  filters: EmptyEntriesFilters;
  error: null;
  _pageCursor: EmptyPageCursor;
};

type ConnectingState = {
  status: 'connecting';
  currentPage: 1;
  filters: EmptyEntriesFilters;
  error: null;
  _pageCursor: EmptyPageCursor;
};

type ConnectedState = {
  status: 'connected';
  currentPage: number;
  filters: EntriesFilters;
  error: null;
  _pageCursor: PageCursor;
};

type ErrorState = {
  status: 'error';
  currentPage: null;
  filters: EmptyEntriesFilters;
  error: string;
  _pageCursor: EmptyPageCursor;
};

type EntriesState = DisconnectedState | ConnectingState | ConnectedState | ErrorState;

const initialState: EntriesState = {
  status: 'disconnected',
  currentPage: null,
  filters: {},
  error: null,
  _pageCursor: { startAt: null, endAt: null },
};

const entriesEntityConfig = entityConfig({
  entity: type<EntryDoc>(),
  collection: '_entries', // Make it private
});

const logger = createLogger('EntriesStore');

export type EntriesStore = InstanceType<typeof EntriesStore>;

export const EntriesStore = signalStore(
  withState<EntriesState>(initialState),
  withEntities(entriesEntityConfig),
  withComputed((store) => {
    return {
      entries: computed(() => store._entriesEntities().slice(0, PAGE_SIZE)),
      hasPreviousPage: computed(() => {
        const currentPage = store.currentPage();
        return currentPage && currentPage > 1;
      }),
      hasNextPage: computed(() => {
        const currentPage = store.currentPage();
        const allEntities = store._entriesEntities();
        return currentPage && allEntities.length > PAGE_SIZE;
      }),
    };
  }),
  withMethods((store) => {
    const authStore = inject(AuthStore);
    const entriesService = inject(EntriesService);

    // ---
    // Internal methods:

    const setDisconnected = () => {
      const newState: DisconnectedState = {
        status: 'disconnected',
        currentPage: null,
        filters: {},
        error: null,
        _pageCursor: { startAt: null, endAt: null },
      };
      patchState(store, removeAllEntities(entriesEntityConfig), newState);
    };

    const setConnecting = () => {
      const newState: ConnectingState = {
        status: 'connecting',
        currentPage: 1,
        filters: {},
        error: null,
        _pageCursor: { startAt: null, endAt: null },
      };
      patchState(store, removeAllEntities(entriesEntityConfig), newState);
    };

    const setConnected = (entries: EntryDoc[]) => {
      const newState: Partial<ConnectedState> = { status: 'connected', error: null };
      patchState(store, setAllEntities(entries, entriesEntityConfig), newState);
    };

    const setError = (error: string) => {
      const newState: ErrorState = {
        status: 'error',
        currentPage: null,
        filters: {},
        error,
        _pageCursor: { startAt: null, endAt: null },
      };
      patchState(store, removeAllEntities(entriesEntityConfig), newState);
    };

    const connectedStream$ = (
      userId: string,
      pageSize: number,
      pageCursor: PageCursor,
      filters: EntriesFilters,
    ): Observable<void> => {
      return entriesService.getEntryDocs$(userId, pageSize, pageCursor, filters).pipe(
        tapResponse({
          next: (snapshots) => setConnected(snapshots),
          error: (error) => {
            logger.error('Error getting entries data:', error);
            setError('Unable to fetch your log entries. Try refreshing the page in a few minutes.');
          },
        }),
        map(() => undefined),
      );
    };

    const disconnectedStream$ = (): Observable<never> => {
      return EMPTY.pipe(finalize(() => setDisconnected()));
    };

    // ---

    return {
      manageStream: rxMethod<'connect' | 'disconnect'>(
        pipe(
          tap((action) => logger.log(`manageStream - action = ${action}`)),
          tap((action) => (action === 'connect' ? setConnecting() : null)),
          switchMap((action) => {
            if (action === 'connect') {
              return authStore.user$.pipe(
                map((user) => user?.id),
                distinctUntilChanged(),
                combineLatestWith(toObservable(store._pageCursor), toObservable(store.filters)),
                switchMap(([userId, pageCursor, filters]) => {
                  if (userId) {
                    // We fetch one extra to check if there's more for a next page
                    const pageSize = PAGE_SIZE + 1;
                    return connectedStream$(userId, pageSize, pageCursor, filters);
                  } else {
                    return disconnectedStream$();
                  }
                }),
              );
            } else {
              return disconnectedStream$();
            }
          }),
        ),
      ),
      previousPage(): void {
        const currentPage = store.currentPage();
        const hasPreviousPage = store.hasPreviousPage();
        if (currentPage && hasPreviousPage) {
          const allEntities = store._entriesEntities();
          const lastEntry = allEntities[allEntities.length - 1];
          if (lastEntry) {
            patchState(store, {
              currentPage: currentPage - 1,
              _pageCursor: { startAt: null, endAt: lastEntry.timestamp },
            });
          }
        }
      },
      nextPage(): void {
        const currentPage = store.currentPage();
        const hasNextPage = store.hasNextPage();
        if (currentPage && hasNextPage) {
          const allEntities = store._entriesEntities();
          const lastEntry = allEntities[allEntities.length - 1];
          if (lastEntry) {
            patchState(store, {
              currentPage: currentPage + 1,
              _pageCursor: { startAt: lastEntry.timestamp, endAt: null },
            });
          }
        }
      },
      setCategoryFilter(category: string | null | undefined): void {
        if (typeof category === 'undefined') {
          patchState(store, {
            filters: {},
            currentPage: 1,
            _pageCursor: { startAt: null, endAt: null },
          });
        } else {
          patchState(store, {
            filters: { category },
            currentPage: 1,
            _pageCursor: { startAt: null, endAt: null },
          });
        }
      },
    };
  }),
  withHooks({
    onInit(store) {
      effect(() => logger.log('State:', getState(store)));

      store.manageStream('connect');
    },
  }),
);
