import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { EntryDoc } from '@app-shared/models';
import { Timestamp } from 'firebase/firestore';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';
import { ConfigStore } from '../data/config.store';
import { EntriesUpdateStore } from '../data/entries-update.store';
import { EntryItemComponent } from './entry-item.component';

@Component({
  imports: [EntryItemComponent],
  template: `<app-entry-item [entry]="entry" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestComponent {
  @Input() entry!: EntryDoc;
}

describe('EntryItemComponent', () => {
  // See: https://github.com/help-me-mom/ng-mocks/issues/10217
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  MockInstance.scope();

  beforeEach(() =>
    MockBuilder(TestComponent, [ConfigStore, EntriesUpdateStore]).keep(EntryItemComponent, {
      shallow: true,
    }),
  );

  it('should create', () => {
    MockInstance(ConfigStore, 'categories', signal([]));
    MockInstance(EntriesUpdateStore, 'processing', signal(false));

    const mockEntry: EntryDoc = {
      id: '1',
      userId: '1',
      timestamp: Timestamp.now(),
      title: 'Test',
      text: 'Test',
      category: 'Test',
    };

    const fixture = MockRender(TestComponent, { entry: mockEntry });

    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });
});
