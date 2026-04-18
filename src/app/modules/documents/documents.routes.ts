import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/documents/documents.component').then(m => m.DocumentsComponent),
  },
];
