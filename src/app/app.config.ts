import {ApplicationConfig, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideToastr} from 'ngx-toastr';
import {registerLocaleData} from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';

import {routes} from './app.routes';
import {ApiPrefixInterceptor} from './core/interceptors/api-prefix-interceptor/api-prefix.interceptor';
import {AuthInterceptor} from './core/interceptors/auth-interceptor/auth.interceptor';
import {HttpErrorInterceptor} from './core/interceptors/error-interceptor/http-error.interceptor';

// Registrar locale es-CO para que los pipes `number`/`currency` formateen COP
// como "1.240" / "$ 285.000" en todo el panel (Dashboard, Cuotas, tablas).
registerLocaleData(localeEsCO);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: HTTP_INTERCEPTORS, useClass: ApiPrefixInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,       multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor,  multi: true },
  ],
};
