import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Observable, throwError} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';
import {HttpService} from './http.service';
import {StorageService} from './storage.service';
import {EndPoints} from '../utils/endpoints';
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GenericMessageResponse,
  LoginRequest,
  LoginResponse,
  ModulePermissions,
  RefreshTokenRequest,
  ResetPasswordRequest,
  ValidateResetTokenResponse,
} from '../../modules/auth/interfaces/auth.interface';
import {UserResponse} from '../../modules/users/interfaces/user.interface';
import {PermissionAction} from '../utils/permissions';

export type LogoutReason = 'manual' | 'inactivity' | 'expired' | 'other_tab';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /**
   * Flag "este tab cerró la sesión a propósito". Lo usamos para que el
   * listener de {@code storage} (cross-tab) no trate nuestra propia
   * limpieza como si fuera un logout iniciado en otro tab. El evento
   * {@code storage} solo se dispara en OTROS tabs, pero lo mantenemos
   * por simetría y como safety net si el navegador cambiara ese
   * comportamiento.
   */
  private localLogoutInFlight = false;

  constructor(
    private _http: HttpService,
    private _storage: StorageService,
    private _router: Router,
    private _toastr: ToastrService,
  ) {
    this.listenForCrossTabLogout();
  }

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this._http.post<LoginRequest, LoginResponse>(EndPoints.LOGIN, credentials, true);
  }

  public loginSuccess(response: LoginResponse): void {
    this._storage.saveSession(response);
    if (!this.hasAnyView()) {
      this._toastr.error('No tienes acceso a ningún módulo. Comunícate con el administrador.');
      this.logout();
      return;
    }
    this._router.navigateByUrl('/administration/dashboard');
  }

  public saveSession(response: LoginResponse): void {
    this._storage.saveSession(response);
  }

  public navigateAfterLogin(): void {
    this._router.navigateByUrl('/administration/dashboard');
  }

  public changePassword(request: ChangePasswordRequest): Observable<void> {
    return this._http.put<ChangePasswordRequest, void>(EndPoints.CHANGE_PASSWORD, request);
  }

  /**
   * Inicia el flujo de recuperación. El backend responde siempre 200 con un
   * mensaje genérico (exista o no el email) — anti-enumeración. El envío
   * del correo corre async server-side.
   *
   * {@code clearAuthorization=true}: endpoint público; si hay un AT stale
   * guardado, no lo adjuntamos.
   */
  public forgotPassword(email: string): Observable<GenericMessageResponse> {
    return this._http.post<ForgotPasswordRequest, GenericMessageResponse>(
      EndPoints.FORGOT_PASSWORD,
      { email },
      true,
    );
  }

  /**
   * Valida el token antes de mostrar el formulario de nueva contraseña.
   * Devuelve el email enmascarado para UX. Si el token es inválido o
   * expirado, el backend responde 400 {@code INVALID_RESET_TOKEN}.
   */
  public validateResetToken(token: string): Observable<ValidateResetTokenResponse> {
    const url = `${EndPoints.VALIDATE_RESET_TOKEN}?token=${encodeURIComponent(token)}`;
    return this._http.get<ValidateResetTokenResponse>(url, true);
  }

  /**
   * Confirma el reset con token + nueva password. Backend revoca todos los
   * refresh tokens del user (cierre de sesiones activas) y dispara email
   * de confirmación. Posibles errores: 400 {@code INVALID_RESET_TOKEN} o
   * 400 {@code WEAK_PASSWORD}.
   */
  public resetPassword(token: string, newPassword: string): Observable<GenericMessageResponse> {
    return this._http.post<ResetPasswordRequest, GenericMessageResponse>(
      EndPoints.RESET_PASSWORD,
      { token, new_password: newPassword },
      true,
    );
  }

  public isLoggedIn(): boolean {
    const token = this._storage.getToken();
    return !!token && token !== '';
  }

  /**
   * Renueva access + refresh tokens contra el backend. Usado por el
   * AuthInterceptor al detectar un 401. Propaga el error sin tocar el
   * storage si falla (el interceptor decide llamar a logout('expired')).
   *
   * El flag {@code true} en {@code post(...)} activa
   * {@code CLEAR_AUTHORIZATION} → el interceptor NO adjunta el access
   * viejo, evitando bucles si el backend rechaza.
   */
  public refreshToken(): Observable<LoginResponse> {
    const refresh_token = this._storage.getRefreshToken();
    if (!refresh_token) {
      return throwError(() => new Error('NO_REFRESH_TOKEN'));
    }
    return this._http
      .post<RefreshTokenRequest, LoginResponse>(EndPoints.REFRESH, { refresh_token }, true)
      .pipe(tap(res => this._storage.setTokens(res)));
  }

  /**
   * Cierra sesión. Invalida el refresh token en backend (idempotente en
   * el server — tokens ya revocados o inexistentes devuelven 204),
   * limpia storage local y redirige a /auth con el motivo como query
   * param para que el LoginComponent muestre el toast apropiado.
   *
   * @param reason 'manual' (user click), 'inactivity' (30 min sin
   *   interacción) o 'expired' (refresh falló → sesión muerta).
   */
  public logout(reason: LogoutReason = 'manual'): void {
    const refresh_token = this._storage.getRefreshToken();
    this.localLogoutInFlight = true;
    const cleanup = () => {
      this._storage.removeAll();
      sessionStorage.clear();
      this._router.navigate(['/auth'], { queryParams: { reason } })
        .finally(() => { this.localLogoutInFlight = false; });
    };

    if (!refresh_token) {
      cleanup();
      return;
    }

    // Fire-and-forget: si el backend falla, igual limpiamos local —
    // el user quiere cerrar sesión pase lo que pase.
    this._http
      .post<RefreshTokenRequest, void>(EndPoints.LOGOUT, { refresh_token }, true)
      .subscribe({ next: cleanup, error: cleanup });
  }

  // TODO(MVP): "Cerrar sesión en todos los dispositivos" — dejado comentado
  // hasta que se reactive el endpoint backend. Reactivar también
  // EndPoints.LOGOUT_ALL y el botón en MainAdministrationComponent.
  //
  // /**
  //  * Cierra sesión en TODOS los dispositivos del usuario. El backend revoca
  //  * todos los refresh tokens activos (RefreshTokenRepository.revokeAllForUser)
  //  * y luego limpiamos local como un logout normal. Útil cuando el user
  //  * sospecha que le comprometieron una sesión y quiere botar a todos los
  //  * intrusos desde cualquier dispositivo.
  //  *
  //  * El endpoint requiere auth (lee el user del SecurityContext). Si algo
  //  * falla en el backend (timeout, 5xx), seguimos con la limpieza local —
  //  * mejor dejar al user fuera con un backend confuso que dejarlo "dentro"
  //  * pensando que cerró todo.
  //  */
  // public logoutAllDevices(): Observable<void> {
  //   return this._http.post<Record<string, never>, void>(EndPoints.LOGOUT_ALL, {}, false);
  // }

  /**
   * Indica si al access token le quedan menos de {@code withinMs} para
   * expirar. Usado por el layout para disparar un refresh preventivo al
   * volver de suspend/background, evitando la ráfaga de 401s del
   * dashboard al remontarse.
   *
   * Retorna {@code false} si no hay token o la clave no está en storage —
   * en ese caso el interceptor/guards ya van a redirigir a login.
   */
  public isAccessTokenNearExpiry(withinMs = 15 * 60 * 1000): boolean {
    const expiresAt = this._storage.getAccessTokenExpiresAt();
    if (!expiresAt) return false;
    return expiresAt - Date.now() < withinMs;
  }

  /**
   * Registra un listener en el evento {@code storage} del window. Cuando
   * OTRO tab de la misma origin borra {@code access_token} (logout), este
   * tab replica la salida para no dejar una UI autenticada con un storage
   * vacío detrás.
   *
   * Mecánica:
   * - El evento {@code storage} SOLO se dispara en tabs distintos al que
   *   modificó localStorage. El tab que cerró la sesión NO recibe su
   *   propio evento → no hay bucle.
   * - {@code e.key === 'access_token' && e.oldValue && !e.newValue} =
   *   alguien borró el token. Las escrituras (login/refresh) traen
   *   newValue ≠ null y se ignoran acá.
   * - Si ya estamos en {@code /auth}, no renavegamos — evita el flash de
   *   URL cuando dos tabs estaban en login y uno de ellos dispara algo.
   */
  private listenForCrossTabLogout(): void {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key !== 'access_token') return;
      if (!e.oldValue || e.newValue) return;
      if (this.localLogoutInFlight) return;

      // El otro tab ya limpió localStorage (localStorage es compartido
      // por origen); como medida defensiva igual limpiamos los keys de
      // sessionStorage de este tab, que son per-tab y no los toca nadie
      // más.
      sessionStorage.clear();

      if (this._router.url.startsWith('/auth')) return;
      this._router.navigate(['/auth'], { queryParams: { reason: 'other_tab' } });
    });
  }

  public getUser(): UserResponse {
    return this._storage.getItem('user');
  }

  public getTenantId(): string {
    return this._storage.getTenantId();
  }

  public getImplementationType(): string | null {
    return this._storage.getImplementationType();
  }

  public getRoles(): string[] {
    return this.getUser()?.roles ?? [];
  }

  public isAdmin(): boolean {
    return this.getRoles().includes('ADMIN');
  }

  public isTenantOwner(): boolean {
    return this.getRoles().includes('TENANT_OWNER');
  }

  public hasAnyView(): boolean {
    if (this.isAdmin()) return true;
    const modules: ModulePermissions[] = this._storage.getModules() ?? [];
    return modules.some(m => m.permissions?.['view']);
  }

  public hasPermission(moduleRoute: string, permission: PermissionAction): boolean {
    if (this.isAdmin()) return true;
    const modules: ModulePermissions[] = this._storage.getModules() ?? [];
    const mod = modules.find(m => m.route === moduleRoute);
    return !!mod?.permissions?.[permission];
  }

  public getModulePermissions(moduleRoute: string): Record<string, boolean> {
    const modules: ModulePermissions[] = this._storage.getModules() ?? [];
    return modules.find(m => m.route === moduleRoute)?.permissions ?? {};
  }
}
