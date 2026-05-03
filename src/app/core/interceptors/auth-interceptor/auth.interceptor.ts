import {Injectable, Injector} from '@angular/core';
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, filter, switchMap, take} from 'rxjs/operators';
import {StorageService} from '../../services/storage.service';
import {AuthService} from '../../services/auth.service';
import {LoginResponse} from '../../../modules/auth/interfaces/auth.interface';

/**
 * Context flag: cuando es {@code true} el interceptor NO adjunta el
 * access token al request. Lo usan {@code /api/auth/login},
 * {@code /api/auth/refresh} y {@code /api/auth/logout} — endpoints que
 * no deben llevar el access viejo (y también evita el loop si el 401
 * llega desde /refresh).
 */
export const CLEAR_AUTHORIZATION = new HttpContextToken<boolean>(() => false);

/**
 * Adjunta el {@code Authorization: Bearer} al request y maneja el 401
 * con refresh silencioso. Si N requests disparan 401 al mismo tiempo,
 * sólo UNO pega el {@code /api/auth/refresh}: los demás esperan al
 * {@code BehaviorSubject} y se reintentan con el token nuevo.
 *
 * Si el refresh falla (RT inválido/expirado/reusado), dispara
 * {@code AuthService.logout('expired')} y propaga el 401 al caller.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  // null mientras corre el refresh; string con el nuevo AT al terminar.
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private _storage: StorageService,
    // Inyección por Injector para romper el ciclo
    // AuthInterceptor → AuthService → HttpService → (file con
    // CLEAR_AUTHORIZATION en este mismo archivo).
    private _injector: Injector,
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isCleared = request.context.get(CLEAR_AUTHORIZATION);
    const authedReq = isCleared ? request : this.attachToken(request);

    return next.handle(authedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // Los endpoints públicos (login, refresh, logout) no deben
        // disparar el refresh-loop: propagan el 401 al caller.
        if (err.status === 401 && !isCleared && this._storage.getRefreshToken()) {
          return this.handle401(authedReq, next);
        }
        return throwError(() => err);
      }),
    );
  }

  private attachToken(request: HttpRequest<any>): HttpRequest<any> {
    const token = this._storage.getToken();
    if (!token) return request;
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private handle401(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const auth = this._injector.get(AuthService);
      return auth.refreshToken().pipe(
        switchMap((res: LoginResponse) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.access_token);
          return next.handle(this.cloneWithToken(request, res.access_token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          // Sesión muerta → forzar logout con motivo 'expired'. El
          // login muestra el toast "Tu sesión expiró".
          auth.logout('expired');
          return throwError(() => err);
        }),
      );
    }

    // Ya hay un refresh en curso: esperar al token nuevo y reintentar.
    return this.refreshTokenSubject.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((token) => next.handle(this.cloneWithToken(request, token))),
    );
  }

  private cloneWithToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}
