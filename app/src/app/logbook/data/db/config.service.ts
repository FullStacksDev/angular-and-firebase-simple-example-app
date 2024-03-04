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
      tap((change) => logger.debug('#getConfig config change snapshot from RTDB:', change)),
      map((change) => {
        const data = change.snapshot.val();

        // We expect a Record<string, string> for the `categories` key.
        // Which we need to convert to a flat list.
        const categories = Object.keys(data.categories || {});

        return {
          categories,
        };
      }),
    );
  }
}
