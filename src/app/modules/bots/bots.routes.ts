import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/bots/bots.component').then(m => m.BotsComponent),
  },
  {
    path: ':bot_id/customize',
    loadComponent: () =>
      import('./pages/customize/customize.component').then(m => m.CustomizeBotPageComponent),
    children: [
      { path: '', redirectTo: 'prompt', pathMatch: 'full' },
      {
        path: 'prompt',
        loadComponent: () =>
          import('./pages/customize/tabs/system-prompt-form/system-prompt-form.component')
            .then(m => m.SystemPromptFormComponent),
      },
      {
        path: 'install',
        loadComponent: () =>
          import('./pages/customize/tabs/widget-install/widget-install.component')
            .then(m => m.WidgetInstallComponent),
      },
    ],
  },
];
