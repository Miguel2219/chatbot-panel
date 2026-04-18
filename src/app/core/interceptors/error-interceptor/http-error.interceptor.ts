import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../../services/loading.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(
    private _loader: LoadingService,
    private _toastr: ToastrService,
    private _auth: AuthService,
    private _dialog: MatDialog,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error) => {
        this._loader.hide();
        this._loader.hideLoaderTable();

        switch (error.status) {
          case 400:
            this._toastr.error(
              error.error?.message ?? 'Datos inválidos. Verifica la información.',
              'Error'
            );
            break;

          case 401:
            if (this._auth.isLoggedIn()) {
              this._auth.logout();
              this._dialog.closeAll();
              this._toastr.warning('Sesión expirada. Inicia sesión nuevamente.', 'Sesión');
            } else {
              this._toastr.warning(error.error?.message ?? 'Credenciales incorrectas.', 'Acceso');
            }
            break;

          case 403:
            this._toastr.warning('No tienes permiso para realizar esta acción.', 'Permiso');
            break;

          case 404:
            this._toastr.error(
              error.error?.message ?? 'Recurso no encontrado.',
              'No encontrado'
            );
            break;

          case 409:
            this._toastr.error(
              error.error?.message ?? 'Conflicto con un recurso existente.',
              'Conflicto'
            );
            break;

          case 500:
            this._toastr.error(
              'Error interno del servidor. Intenta más tarde.',
              'Error del servidor'
            );
            break;

          default:
            this._toastr.error('Ocurrió un error inesperado.', 'Error');
        }

        return throwError(() => error);
      })
    );
  }
}
