import { AuthStore } from '@app-shared/auth/data/auth.store';
import { MockBuilder, MockInstance, ngMocks } from 'ng-mocks';
import { EntriesService } from './db/entries.service';
import { EntriesUpdateStore } from './entries-update.store';

describe('EntriesUpdateStore', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(EntriesUpdateStore).mock(AuthStore).mock(EntriesService));

  it('should create', () => {
    const store = ngMocks.get(EntriesUpdateStore);
    expect(store).toBeTruthy();
  });
});
