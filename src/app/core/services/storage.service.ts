import {Injectable} from '@angular/core';
import SecureLS from 'secure-ls';
import {LoginResponse, ModulePermissions} from '../../modules/auth/interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private ls = new SecureLS({ encodingType: 'aes', isCompression: false });

  // ─── Generic ──────────────────────────────────────────────────
  setItem(key: string, value: any): void {
    this.ls.set(key, value);
  }

  getItem<T>(key: string): T {
    return this.ls.get(key);
  }

  removeItem(key: string): void {
    this.ls.remove(key);
  }

  removeAll(): void {
    this.ls.removeAll();
  }

  clear(): void {
    this.ls.clear();
  }

  // ─── Session ──────────────────────────────────────────────────
  saveSession(response: LoginResponse): void {
    this.setTokens(response);
    this.ls.set('modules', response.modules);
    this.ls.set('implementation_type', response.implementation_type);

    const user: any = {
      user_id: response.user.user_id,
      email: response.user.email,
      roles: response.user.roles,
      must_change_password: response.user.must_change_password,
      name: response.user.name,
      notification_channel: response.user.notification_channel,
      lastname: response.user.lastname
    };

    if (response.user.tenant_id) {
      user.tenant_id = response.user.tenant_id;
    }
    this.ls.set('user', user);
  }

  /**
   * Persiste únicamente los tokens + su expiración. Usado tras un
   * refresh silencioso para no pisar user/modules/implementation_type
   * ya cargados.
   */
  setTokens(response: Pick<LoginResponse, 'access_token' | 'refresh_token' | 'expires_in'>): void {
    this.ls.set('access_token', response.access_token);
    this.ls.set('refresh_token', response.refresh_token);
    this.ls.set('access_token_expires_at', Date.now() + response.expires_in * 1000);
  }

  getToken(): string {
    return this.ls.get('access_token') ?? '';
  }

  getRefreshToken(): string {
    return this.ls.get('refresh_token') ?? '';
  }

  /**
   * Timestamp (ms desde epoch) en el que el AT actual deja de ser válido.
   * Escrito por {@link setTokens} a partir de {@code expires_in} del
   * backend. Retorna {@code null} si no hay sesión.
   */
  getAccessTokenExpiresAt(): number | null {
    return this.ls.get('access_token_expires_at') ?? null;
  }

  getModules(): ModulePermissions[] {
    return this.ls.get('modules') ?? [];
  }

  getTenantId(): string {
    // El tenant_id se guarda anidado dentro del objeto `user` en saveSession()
    // — no como clave standalone. Leemos desde ahí para mantener single source
    // of truth y evitar duplicación.
    const user: any = this.ls.get('user');
    return user?.tenant_id ?? '';
  }

  getImplementationType(): string | null {
    return this.ls.get('implementation_type') ?? null;
  }
}
