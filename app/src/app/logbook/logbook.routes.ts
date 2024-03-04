import { Routes } from '@angular/router';
import { authGuard } from '@app-shared/auth/util/auth.guard';
import { ConfigStore } from './data/config.store';
import { EntriesUpdateStore } from './data/entries-update.store';
import { EntriesStore } from './data/entries.store';
import { LogbookPageComponent } from './feature/logbook-page.component';
import { LogbookShellComponent } from './logbook-shell.component';

const routes: Routes = [
  {
    path: '',
    component: LogbookShellComponent,
    canMatch: [authGuard('authed')],
    providers: [ConfigStore, EntriesStore, EntriesUpdateStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: LogbookPageComponent,
      },
    ],
  },
];

export default routes;
