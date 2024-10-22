import { Config } from '@app-shared/models';
import { MockBuilder, MockInstance, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { ConfigStore } from './config.store';
import { ConfigService } from './db/config.service';

describe('ConfigStore', () => {
  // See: https://github.com/help-me-mom/ng-mocks/issues/10217
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  MockInstance.scope();

  beforeEach(() => MockBuilder(ConfigStore, null).mock(ConfigService));

  it('should create', () => {
    const mockConfig: Config = { categories: ['test'] };
    MockInstance(ConfigService, 'getConfig$', () => of(mockConfig));

    const store = ngMocks.get<ConfigStore>(ConfigStore);
    expect(store).toBeTruthy();
    expect(store.status()).toEqual('connected');
    expect(store.categories()).toEqual(['test']);
  });

  it('disconnects', () => {
    const mockConfig: Config = { categories: ['test'] };
    MockInstance(ConfigService, 'getConfig$', () => of(mockConfig));

    const store = ngMocks.get<ConfigStore>(ConfigStore);
    store.manageStream('disconnect');
    expect(store.status()).toEqual('disconnected');
    expect(store.categories()).toEqual([]);
  });
});
