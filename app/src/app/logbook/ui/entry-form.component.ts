import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { createLogger } from '@app-shared/logger';
import { EntryDoc, NewOrUpdatedEntryInput } from '@app-shared/models';

const logger = createLogger('EntryFormComponent');

@Component({
  selector: 'app-entry-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <form [formGroup]="formGroup" #form="ngForm" (ngSubmit)="submit(form)" novalidate>
      <mat-form-field class="w-full">
        <mat-label>Title</mat-label>
        <input #titleInput matInput formControlName="title" />
        @if (formGroup.get('title')?.hasError('required')) {
          <mat-error>You must enter a title</mat-error>
        }
      </mat-form-field>

      <mat-form-field class="mt-4 w-full">
        <mat-label>Text</mat-label>
        <textarea matInput formControlName="text" rows="6"></textarea>
        @if (formGroup.get('text')?.hasError('required')) {
          <mat-error>You must enter some text for the log entry</mat-error>
        }
      </mat-form-field>

      <mat-form-field class="mt-4 w-full">
        <mat-label>Category</mat-label>
        <mat-select formControlName="category">
          <mat-option [value]="null">(none)</mat-option>
          @for (c of categories(); track c) {
            <mat-option [value]="c">{{ c }}</mat-option>
          }
        </mat-select>
        <mat-hint>Optional</mat-hint>
      </mat-form-field>

      <div class="mt-4 flex w-full flex-row-reverse items-center justify-between">
        <button type="submit" mat-flat-button [disabled]="processing()">Save</button>
        <button type="button" mat-button (click)="cancel()">Cancel</button>
      </div>
    </form>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryFormComponent implements OnInit {
  readonly #fb = inject(FormBuilder);

  readonly processing = input.required<boolean>();
  readonly categories = input.required<string[]>();
  readonly existingEntry = input<EntryDoc>();

  readonly submitted = output<NewOrUpdatedEntryInput>();
  readonly canceled = output();

  readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');

  readonly formGroup = this.#fb.nonNullable.group({
    title: ['', [Validators.required]],
    text: ['', [Validators.required]],
    category: [null as string | null],
  });

  constructor() {
    // Keep the form in sync with the existing entry
    effect(() => {
      const entry = this.existingEntry();
      untracked(() => this.#syncEntryWithForm(entry));
    });
  }

  ngOnInit() {
    this.titleInput().nativeElement.focus();
  }

  submit(form: FormGroupDirective) {
    logger.log(`submit - form.valid = ${form.valid}, form data =`, this.formGroup.value);

    if (form.valid) {
      const { title, text, category } = this.formGroup.value;
      if (title && text) {
        this.submitted.emit({ title, text, category: category ?? null });
      }
    }
  }

  cancel() {
    logger.log('cancel');

    this.#syncEntryWithForm(this.existingEntry());
    this.canceled.emit();
  }

  #syncEntryWithForm(entry: EntryDoc | undefined) {
    if (entry) {
      this.formGroup.patchValue({
        title: entry.title,
        text: entry.text,
        category: entry.category,
      });
    } else {
      this.formGroup.reset();
    }
  }
}
