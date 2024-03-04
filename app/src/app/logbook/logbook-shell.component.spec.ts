import { MockBuilder, MockRender } from 'ng-mocks';
import { LogbookShellComponent } from './logbook-shell.component';

describe('LogbookShellComponent', () => {
  beforeEach(() => MockBuilder(LogbookShellComponent, null));

  it('should create', () => {
    const fixture = MockRender(LogbookShellComponent);

    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });
});
