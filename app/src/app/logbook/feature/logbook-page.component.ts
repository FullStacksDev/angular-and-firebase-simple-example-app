import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { createLogger } from '@app-shared/logger';
import { ConfigStore } from '../data/config.store';
import { EntriesUpdateStore } from '../data/entries-update.store';
import { EntriesStore } from '../data/entries.store';
import { EntryItemComponent } from './entry-item.component';
import { NewEntryPanelComponent } from './new-entry-panel.component';

const logger = createLogger('LogbookPageComponent');

@Component({
  selector: 'app-logbook-page',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NewEntryPanelComponent,
    EntryItemComponent,
  ],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    } @else {
      @if (processing()) {
        <mat-progress-bar mode="indeterminate" />
      }
      <h1 class="mat-headline-medium mt-4 py-2 text-center">My logbook</h1>
      <main class="flex h-full flex-col items-center px-4 py-0">
        @if (status() === 'error') {
          <div class="flex items-center justify-center px-3 py-8">
            <div class="text-center">
              <h2 class="text-2xl font-bold">Oops!</h2>
              <p class="mt-2">{{ error() }}</p>
            </div>
          </div>
        } @else if (status() === 'connected') {
          <div class="flex w-full flex-col sm:w-96">
            <app-new-entry-panel [categories]="categories()" [onboarding]="onboarding()" />

            @if (!onboarding()) {
              <section class="py-6">
                <h2 class="mat-title-large my-4 text-center">Entries</h2>

                <div class="mb-3 mt-5 flex w-full flex-col items-center space-y-4">
                  <mat-form-field class="w-fit">
                    <mat-label>Filter by category</mat-label>
                    <mat-select
                      [value]="selectedCategory()"
                      (selectionChange)="onCategoryFilterChange($event.value)"
                    >
                      <mat-option [value]="undefined">-- no filter --</mat-option>
                      <mat-option [value]="''">No category set</mat-option>
                      @for (c of categories(); track c) {
                        <mat-option [value]="c">{{ c }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  @if (hasPreviousPage() || hasNextPage()) {
                    <div class="flex flex-row items-center justify-center">
                      <button
                        mat-icon-button
                        class="text-sm"
                        (click)="previousPage()"
                        [disabled]="!hasPreviousPage()"
                        aria-label="Previous page"
                      >
                        <mat-icon>arrow_back_ios</mat-icon>
                      </button>
                      <span>Page {{ currentPage() }}</span>
                      <button
                        mat-icon-button
                        (click)="nextPage()"
                        [disabled]="!hasNextPage()"
                        aria-label="Next page"
                      >
                        <mat-icon>arrow_forward_ios"</mat-icon>
                      </button>
                    </div>
                  }
                </div>

                @for (entry of entries(); track entry.id) {
                  <div class="mb-3">
                    <app-entry-item [entry]="entry" />
                  </div>
                } @empty {
                  <p class="mt-6 py-3 text-center text-base italic">No entries found</p>
                }
              </section>
            }
          </div>
        }
      </main>
    }
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogbookPageComponent {
  readonly #router = inject(Router);
  readonly #configStore = inject(ConfigStore);
  readonly #entriesStore = inject(EntriesStore);
  readonly #entriesUpdateStore = inject(EntriesUpdateStore);

  readonly selectedCategory = input<string | undefined>(undefined, { alias: 'category' });

  readonly processing = this.#entriesUpdateStore.processing;
  readonly categories = this.#configStore.categories;
  readonly status = this.#entriesStore.status;
  readonly currentPage = this.#entriesStore.currentPage;
  readonly hasPreviousPage = this.#entriesStore.hasPreviousPage;
  readonly hasNextPage = this.#entriesStore.hasNextPage;
  readonly filters = this.#entriesStore.filters;
  readonly entries = this.#entriesStore.entries;
  readonly error = this.#entriesStore.error;

  readonly onboarding = signal(false);

  readonly loading = computed(() => {
    const configStatus = this.#configStore.status();
    const entriesStatus = this.#entriesStore.status();
    return configStatus === 'connecting' || entriesStatus === 'connecting';
  });

  constructor() {
    // Handle selected category change
    effect(() => {
      const selectedCategory = this.selectedCategory();
      logger.debug('selectedCategory:', selectedCategory);

      // Convert '' -> null
      const parsedValue = selectedCategory === '' ? null : selectedCategory;

      untracked(() => this.#entriesStore.setCategoryFilter(parsedValue));
    });

    // Calculate onboarding flag
    const onboardingEffect = effect(() => {
      const entriesStatus = this.#entriesStore.status();
      const selectedCategory = this.selectedCategory();
      const entries = this.#entriesStore.entries();

      logger.debug('entries.length:', entries.length);

      if (entriesStatus === 'connected' && typeof selectedCategory === 'undefined') {
        untracked(() => this.onboarding.set(entries.length === 0));
      }

      // Assumption: if we ever see any entries we can safely disconnect this effect as we definitely don't want to recalculate onboarding state then.
      if (entries.length > 0) {
        onboardingEffect.destroy();
      }
    });

    effect(() => {
      logger.debug('onboarding:', this.onboarding());
    });
  }

  previousPage() {
    this.#entriesStore.previousPage();
  }

  nextPage() {
    this.#entriesStore.nextPage();
  }

  async onCategoryFilterChange(category: string | null | undefined) {
    logger.log('onCategoryFilterChange - category:', category);
    await this.#router.navigate([], { queryParams: { category } });
  }
}
