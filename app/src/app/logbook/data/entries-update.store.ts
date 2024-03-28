import { Injectable, effect, inject } from '@angular/core';
import { AuthStore } from '@app-shared/auth/data/auth.store';
import { createLogger } from '@app-shared/logger';
import { NewOrUpdatedEntryInput } from '@app-shared/models';
import { tapResponse } from '@ngrx/operators';
import {
  getState,
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, concatMap, pipe, tap } from 'rxjs';
import { EntriesService } from './db/entries.service';

type EntriesUpdateState = {
  processing: boolean;
  error: string | null;
};

const initialState: EntriesUpdateState = {
  processing: false,
  error: null,
};

const logger = createLogger('EntriesUpdateStore');

const _EntriesUpdateStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const authStore = inject(AuthStore);
    const entriesService = inject(EntriesService);

    // ---
    // Internal methods:

    const setProcessing = (processing: boolean) => {
      patchState(store, { processing, error: null });
    };

    const setError = (error: string) => {
      patchState(store, { processing: false, error });
    };

    // ---

    return {
      create: rxMethod<{ data: NewOrUpdatedEntryInput }>(
        pipe(
          tap((params) => logger.log(`#create - data = ${params.data}`)),
          tap(() => setProcessing(true)),
          concatMap(({ data }) => {
            const user = authStore.user();
            if (user) {
              return entriesService.createEntryDoc$(user.id, data);
            } else {
              setError('Not logged in');
              return EMPTY;
            }
          }),
          tapResponse({
            next: () => setProcessing(false),
            error: (error) => {
              logger.error('#create - error:', error);
              setError(
                'Something went wrong when creating a new log entry. Please try again later.',
              );
            },
          }),
        ),
      ),
      update: rxMethod<{ entryId: string; data: NewOrUpdatedEntryInput }>(
        pipe(
          tap((params) =>
            logger.log(`#update - entryId = ${params.entryId}, data = ${params.data}`),
          ),
          tap(() => setProcessing(true)),
          concatMap(({ entryId, data }) => {
            const user = authStore.user();
            if (user) {
              return entriesService.updateEntryDoc$(entryId, data);
            } else {
              setError('Not logged in');
              return EMPTY;
            }
          }),
          tapResponse({
            next: () => setProcessing(false),
            error: (error) => {
              logger.error('#update - error:', error);
              setError('Something went wrong when updating a log entry. Please try again later.');
            },
          }),
        ),
      ),
      delete: rxMethod<string>(
        pipe(
          tap((entryId) => logger.log(`#delete - entryId = ${entryId}`)),
          tap(() => setProcessing(true)),
          concatMap((entryId) => {
            const user = authStore.user();
            if (user) {
              return entriesService.deleteEntryDoc$(entryId);
            } else {
              setError('Not logged in');
              return EMPTY;
            }
          }),
          tapResponse({
            next: () => setProcessing(false),
            error: (error) => {
              logger.error('#delete - error:', error);
              setError('Something went wrong when deleting a log entry. Please try again later.');
            },
          }),
        ),
      ),
    };
  }),
  withHooks({
    onInit(store) {
      effect(() => logger.log('State:', getState(store)));
    },
  }),
);

@Injectable()
export class EntriesUpdateStore extends _EntriesUpdateStore {}
