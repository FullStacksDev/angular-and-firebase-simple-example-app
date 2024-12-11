import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { EntryFormComponent } from './entry-form.component';

@Component({
  imports: [EntryFormComponent],
  template: `<app-entry-form [processing]="processing" [categories]="categories" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestComponent {
  @Input() processing = false;
  @Input() categories = [] as string[];
}

describe('EntryFormComponent', () => {
  beforeEach(() =>
    MockBuilder(TestComponent, null).keep(EntryFormComponent, {
      shallow: true,
    }),
  );

  it('should create', () => {
    const fixture = MockRender(TestComponent);

    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('renders the form', () => {
    const fixture = MockRender(TestComponent);

    const el = ngMocks.find(fixture, 'form');
    expect(el).toBeTruthy();
  });
});
