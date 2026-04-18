import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/conversations/conversations.component').then(m => m.ConversationsComponent),
  },
];
