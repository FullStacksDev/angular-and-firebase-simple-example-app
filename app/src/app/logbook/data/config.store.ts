import { Injectable, effect, inject } from '@angular/core';
import { createLogger } from '@app-shared/logger';
import { Config } from '@app-shared/models';
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
import { EMPTY, Observable, finalize, pipe, switchMap, tap } from 'rxjs';
import { ConfigService } from './db/config.service';

type DisconnectedState = {
  status: 'disconnected';
  categories: [];
  error: null;
};

type ConnectingState = {
  status: 'connecting';
  categories: [];
  error: null;
};

type ConnectedState = {
  status: 'connected';
  categories: Config['categories'];
  error: null;
};

type ErrorState = {
  status: 'error';
  categories: [];
  error: string;
};

type ConfigState = DisconnectedState | ConnectingState | ConnectedState | ErrorState;

const initialState: ConfigState = {
  status: 'disconnected',
  categories: [],
  error: null,
};

const logger = createLogger('ConfigStore');

const _ConfigStore = signalStore(
  withState<ConfigState>(initialState),
  withMethods((store) => {
    const configService = inject(ConfigService);

    // ---
    // Internal methods:

    const setConnecting = () => {
      const newState: ConnectingState = { status: 'connecting', categories: [], error: null };
      patchState(store, newState);
    };

    const setConnected = (config: Config) => {
      const newState: ConnectedState = { status: 'connected', ...config, error: null };
      patchState(store, newState);
    };

    const setDisconnected = () => {
      const newState: DisconnectedState = { status: 'disconnected', categories: [], error: null };
      patchState(store, newState);
    };

    const setError = (error: string) => {
      const newState: ErrorState = { status: 'error', categories: [], error };
      patchState(store, newState);
    };

    const connectedStream$ = () => {
      return configService.getConfig$().pipe(
        tapResponse({
          next: (config) => setConnected(config),
          error: (error) => {
            logger.error('Error getting config data:', error);
            setError('Unable to fetch config data. Try refreshing the page in a few minutes.');
          },
        }),
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
              return connectedStream$();
            } else {
              return disconnectedStream$();
            }
          }),
        ),
      ),
    };
  }),
  withHooks({
    onInit(store) {
      effect(() => logger.log('State:', getState(store)));

      store.manageStream('connect');
    },
  }),
);

@Injectable()
export class ConfigStore extends _ConfigStore {}
