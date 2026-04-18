import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/whatsapp-config/whatsapp-config.component').then(m => m.WhatsappConfigComponent),
  },
];
