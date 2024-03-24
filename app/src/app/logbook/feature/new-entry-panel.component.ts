import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NewOrUpdatedEntryInput } from '@app-shared/models';
import { EntriesUpdateStore } from '../data/entries-update.store';
import { EntryFormComponent } from '../ui/entry-form.component';

@Component({
  selector: 'app-new-entry-panel',
  standalone: true,
  imports: [FormsModule, MatCardModule, EntryFormComponent, MatFormFieldModule, MatInputModule],
  template: `
    <section>
      @if (onboarding()) {
        <p class="px-3 pb-4 text-center text-lg text-blue-800">
          Start your logbook journey now<br />add your first entry below
        </p>
      }
      <mat-card>
        <mat-card-header>
          <mat-card-title class="w-full text-center tracking-wide text-slate-600"
            >What did you do today?</mat-card-title
          >
        </mat-card-header>
        <mat-card-content class="mt-3">
          @if (expanded()) {
            <app-entry-form
              [processing]="processing()"
              [categories]="categories()"
              (submitted)="onSubmitted($event)"
              (canceled)="onCanceled()"
            />
          } @else {
            <mat-form-field class="w-full">
              <input
                matInput
                (click)="toggleExpanded()"
                (focus)="toggleExpanded()"
                class="w-full"
                placeholder="Click here and start typing..."
              />
            </mat-form-field>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewEntryPanelComponent {
  readonly #entriesUpdateStore = inject(EntriesUpdateStore);

  readonly processing = this.#entriesUpdateStore.processing;

  readonly categories = input.required<string[]>();
  readonly onboarding = input<boolean>(false);

  readonly expanded = signal(false);

  constructor() {
    // Sync the onboarding input flag with the expanded state
    effect(() => {
      untracked(() => this.expanded.set(this.onboarding()));
    });
  }

  toggleExpanded() {
    this.expanded.update((current) => !current);
  }

  onSubmitted(data: NewOrUpdatedEntryInput) {
    this.#entriesUpdateStore.create({ data });
    this.expanded.set(false);
  }

  onCanceled() {
    this.expanded.set(false);
  }
}
