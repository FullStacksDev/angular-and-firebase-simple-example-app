import { Injectable } from '@angular/core';
import { injectRtdb, object$ } from '@app-shared/firebase/rtdb';
import { createLogger } from '@app-shared/logger';
import { Config } from '@app-shared/models';
import { ref } from 'firebase/database';
import { Observable, map, tap } from 'rxjs';

const logger = createLogger('ConfigService');

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  readonly #rtdb = injectRtdb();

  getConfig$(): Observable<Config> {
    const objectRef = ref(this.#rtdb, 'config');
    return object$(objectRef).pipe(
      tap((change) => logger.debug('getConfig$ - config change snapshot from RTDB:', change)),
      map((change) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = change.snapshot.val();
        if (!data) {
          logger.warn(
            'getConfig$ - no data found in RTDB - please set the config up in the Firebase console (or local emulator console). See the docs for more info.',
          );
        }

        // We expect a Record<string, string> for the `categories` key.
        // Which we need to convert to a flat list.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const categories = Object.keys(data.categories ?? {});

        return {
          categories,
        };
      }),
    );
  }
}
