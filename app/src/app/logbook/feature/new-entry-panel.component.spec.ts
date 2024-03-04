import { signal } from '@angular/core';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';
import { EntriesUpdateStore } from '../data/entries-update.store';
import { NewEntryPanelComponent } from './new-entry-panel.component';

describe('NewEntryPanelComponent', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(NewEntryPanelComponent, [EntriesUpdateStore]));

  it('should create', () => {
    MockInstance(EntriesUpdateStore, 'processing', signal(false));

    const fixture = MockRender(NewEntryPanelComponent);

    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });
});
