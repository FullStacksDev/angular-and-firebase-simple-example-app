import { AuthStore } from '@app-shared/auth/data/auth.store';
import { MockBuilder, MockInstance, ngMocks } from 'ng-mocks';
import { EntriesService } from './db/entries.service';
import { EntriesUpdateStore } from './entries-update.store';

describe('EntriesUpdateStore', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(EntriesUpdateStore, null).mock(AuthStore).mock(EntriesService));

  it('should create', () => {
    const store = ngMocks.get<EntriesUpdateStore>(EntriesUpdateStore);
    expect(store).toBeTruthy();
  });
});
