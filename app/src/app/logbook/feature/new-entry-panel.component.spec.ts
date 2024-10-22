import { signal } from '@angular/core';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';
import { EntriesUpdateStore } from '../data/entries-update.store';
import { NewEntryPanelComponent } from './new-entry-panel.component';

describe('NewEntryPanelComponent', () => {
  // See: https://github.com/help-me-mom/ng-mocks/issues/10217
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  MockInstance.scope();

  beforeEach(() => MockBuilder(NewEntryPanelComponent, [EntriesUpdateStore]));

  it('should create', () => {
    MockInstance(EntriesUpdateStore, 'processing', signal(false));

    const fixture = MockRender(NewEntryPanelComponent);

    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });
});
