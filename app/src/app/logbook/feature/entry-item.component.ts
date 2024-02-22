import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { EntryDoc, NewOrUpdatedEntryInput } from '@app-shared/models';
import { ConfigStore } from '../data/config.store';
import { EntriesUpdateStore } from '../data/entries-update.store';
import { EntryFormComponent } from '../ui/entry-form.component';

@Component({
  selector: 'app-entry-item',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatButtonModule, EntryFormComponent],
  template: `
    <mat-card>
      @if (!editing()) {
        <mat-card-header>
          @if (entry().timestamp; as timestamp) {
            <mat-card-subtitle>
              <span>{{ timestamp.toDate() | date: "EEE dd MMM yyy 'at' hh:mm a" }}</span>
              @if (entry().category; as category) {
                <span class="px-2">•</span>
                <span class="uppercase tracking-widest text-teal-700">{{ category }}</span>
              }
            </mat-card-subtitle>
          }
          <mat-card-title class="py-2">
            {{ entry().title }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content class="py-2 text-base">
          <p>{{ entry().text }}</p>
        </mat-card-content>
        <mat-card-actions class="flex-row-reverse justify-between">
          <button mat-button color="primary" (click)="toggleEditing()" [disabled]="processing()">
            Edit
          </button>
          <button mat-button class="text-red-800" (click)="deleteEntry()" [disabled]="processing()">
            Delete
          </button>
        </mat-card-actions>
      }

      @if (editing()) {
        <mat-card-content>
          <app-entry-form
            [processing]="processing()"
            [categories]="categories()"
            [existingEntry]="entry()"
            (submitted)="onUpdateSubmitted($event)"
            (canceled)="onUpdateCanceled()"
          />
        </mat-card-content>
      }
    </mat-card>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryItemComponent {
  readonly #configStore = inject(ConfigStore);
  readonly #entriesUpdateStore = inject(EntriesUpdateStore);

  readonly categories = this.#configStore.categories;
  readonly processing = this.#entriesUpdateStore.processing;

  readonly entry = input.required<EntryDoc>();

  readonly editing = signal(false);

  toggleEditing() {
    this.editing.update((current) => !current);
  }

  onUpdateSubmitted(data: NewOrUpdatedEntryInput) {
    this.#entriesUpdateStore.update({ entryId: this.entry().id, data });
    this.editing.set(false);
  }

  onUpdateCanceled() {
    this.editing.set(false);
  }

  deleteEntry() {
    if (window.confirm(`Are you sure you want to permanently delete this log entry?`)) {
      this.#entriesUpdateStore.delete(this.entry().id);
    }
  }
}
