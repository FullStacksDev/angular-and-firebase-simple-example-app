import { AuthStore } from '@app-shared/auth/data/auth.store';
import { MockBuilder, MockInstance, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { EntriesService } from './db/entries.service';
import { EntriesStore } from './entries.store';

describe('EntriesStore', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(EntriesStore, null).mock(AuthStore).mock(EntriesService));

  it('should create', () => {
    MockInstance(AuthStore, 'user$', of(null));
    MockInstance(EntriesService, 'getEntryDocs$', () => of([]));

    const store = ngMocks.get<EntriesStore>(EntriesStore);
    expect(store).toBeTruthy();
  });
});
