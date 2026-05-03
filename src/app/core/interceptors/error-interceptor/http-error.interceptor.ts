import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import {LoadingService} from '../../services/loading.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(
    private _loader: LoadingService,
    private _toastr: ToastrService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error) => {
        this._loader.hide();
        this._loader.hideLoaderTable();

        // El 401 lo maneja el AuthInterceptor (refresh silencioso o
        // logout 'expired'). Si aún llega acá, significa que el
        // refresh falló o era un login con credenciales malas: en
        // ambos casos el AuthInterceptor/LoginComponent ya muestran
        // su propio feedback, acá solo dejamos pasar sin toast extra
        // para no solapar mensajes.
        if (error.status === 401) {
          return throwError(() => error);
        }

        switch (error.status) {
          case 400:
            this._toastr.error(
              error.error?.message ?? 'Datos inválidos. Verifica la información.',
              'Error'
            );
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
