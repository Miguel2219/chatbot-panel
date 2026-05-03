import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/quotas-list/quotas-list.component').then(m => m.QuotasListComponent),
  },
];
