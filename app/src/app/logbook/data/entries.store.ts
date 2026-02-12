import { computed, effect, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthStore } from '@app-shared/auth/data/auth.store';
import { createLogger } from '@app-shared/logger';
import { EmptyPageCursor, EntriesFilters, EntryDoc, PageCursor } from '@app-shared/models';
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
  filters: EntriesFilters;
  error: null;
  _pageCursor: EmptyPageCursor;
};

type ConnectingState = {
  status: 'connecting';
  currentPage: 1;
  filters: EntriesFilters;
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
  filters: EntriesFilters;
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
  withState<{ state: EntriesState }>({ state: initialState }),
  withEntities(entriesEntityConfig),
  withComputed((store) => {
    return {
      status: computed(() => store.state.status()),
      currentPage: computed(() => store.state.currentPage()),
      filters: computed(() => store.state.filters()),
      error: computed(() => store.state.error()),
      entries: computed(() => store._entriesEntities().slice(0, PAGE_SIZE)),
      hasPreviousPage: computed(() => {
        const currentPage = store.state.currentPage();
        return currentPage && currentPage > 1;
      }),
      hasNextPage: computed(() => {
        const currentPage = store.state.currentPage();
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
      patchState(store, removeAllEntities(entriesEntityConfig), { state: newState });
    };

    const setConnecting = () => {
      const previousState = store.state();
      const newState: ConnectingState = {
        status: 'connecting',
        currentPage: 1,
        filters: previousState.filters,
        error: null,
        _pageCursor: { startAt: null, endAt: null },
      };
      patchState(store, removeAllEntities(entriesEntityConfig), { state: newState });
    };

    const setConnected = (entries: EntryDoc[]) => {
      const previousState = store.state();
      const newState: ConnectedState = {
        status: 'connected',
        currentPage: previousState.currentPage ?? 1,
        filters: previousState.filters,
        error: null,
        _pageCursor: previousState._pageCursor,
      };
      patchState(store, setAllEntities(entries, entriesEntityConfig), { state: newState });
    };

    const setError = (error: string) => {
      const newState: ErrorState = {
        status: 'error',
        currentPage: null,
        filters: {},
        error,
        _pageCursor: { startAt: null, endAt: null },
      };
      patchState(store, removeAllEntities(entriesEntityConfig), { state: newState });
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
                combineLatestWith(
                  toObservable(store.state._pageCursor),
                  toObservable(store.filters),
                ),
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
            patchState(store, (previousStore) => {
              const previousState = previousStore.state;
              if (previousState.status !== 'connected') {
                return {};
              }

              return {
                state: {
                  ...previousState,
                  currentPage: currentPage - 1,
                  _pageCursor: { startAt: null, endAt: lastEntry.timestamp },
                },
              };
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
            patchState(store, (previousStore) => {
              const previousState = previousStore.state;
              if (previousState.status !== 'connected') {
                return {};
              }

              return {
                state: {
                  ...previousState,
                  currentPage: currentPage + 1,
                  _pageCursor: { startAt: lastEntry.timestamp, endAt: null },
                },
              };
            });
          }
        }
      },
      setCategoryFilter(category: string | null | undefined): void {
        patchState(store, (previousStore) => {
          const previousState = previousStore.state;
          if (previousState.status !== 'connected') {
            return {};
          }

          const nextFilters: EntriesFilters = typeof category === 'undefined' ? {} : { category };
          const resetCursor: EmptyPageCursor = { startAt: null, endAt: null };

          return {
            state: {
              ...previousState,
              filters: nextFilters,
              currentPage: 1,
              _pageCursor: resetCursor,
            },
          };
        });
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
