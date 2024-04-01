import { Config } from '@app-shared/models';
import { MockBuilder, MockInstance, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { ConfigStore } from './config.store';
import { ConfigService } from './db/config.service';

describe('ConfigStore', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(ConfigStore, null).mock(ConfigService));

  it('should create', () => {
    const mockConfig: Config = { categories: ['test'] };
    MockInstance(ConfigService, 'getConfig$', () => of(mockConfig));

    const store = ngMocks.get(ConfigStore);
    expect(store).toBeTruthy();
    expect(store.status()).toEqual('connected');
    expect(store.categories()).toEqual(['test']);
  });

  it('disconnects', () => {
    const mockConfig: Config = { categories: ['test'] };
    MockInstance(ConfigService, 'getConfig$', () => of(mockConfig));

    const store = ngMocks.get(ConfigStore);
    store.manageStream('disconnect');
    expect(store.status()).toEqual('disconnected');
    expect(store.categories()).toEqual([]);
  });
});
