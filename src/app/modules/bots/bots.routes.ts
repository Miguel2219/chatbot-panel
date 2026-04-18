import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/bots/bots.component').then(m => m.BotsComponent),
  },
];
