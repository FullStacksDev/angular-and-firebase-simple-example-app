import { signal } from '@angular/core';
import { EntriesFilters } from '@app-shared/models';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';
import { ConfigStore } from '../data/config.store';
import { EntriesUpdateStore } from '../data/entries-update.store';
import { EntriesStore } from '../data/entries.store';
import { LogbookPageComponent } from './logbook-page.component';

describe('LogbookPageComponent', () => {
  MockInstance.scope();

  beforeEach(() =>
    MockBuilder(LogbookPageComponent, [ConfigStore, EntriesStore, EntriesUpdateStore]),
  );

  it('should create', () => {
    MockInstance(EntriesUpdateStore, 'processing', signal(false));
    MockInstance(ConfigStore, 'status', signal('connecting' as const));
    MockInstance(EntriesStore, 'status', signal('connecting' as const));
    MockInstance(EntriesStore, 'currentPage', signal(1));
    MockInstance(EntriesStore, 'hasPreviousPage', signal(false));
    MockInstance(EntriesStore, 'hasNextPage', signal(false));
    MockInstance(EntriesStore, 'filters', signal({} as EntriesFilters));
    MockInstance(EntriesStore, 'entries', signal([]));
    MockInstance(EntriesStore, 'error', signal(null));
    MockInstance(EntriesStore, 'setCategoryFilter', jasmine.createSpy());

    const fixture = MockRender(LogbookPageComponent);

    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });
});
