import { Injectable } from '@angular/core';
import SecureLS from 'secure-ls';
import { LoginResponse, ModulePermissions } from '../../modules/auth/interfaces/auth.interface';
import {UserResponse} from '../../modules/users/interfaces/user.interface';

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
    this.ls.set('access_token', response.token);
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

  getToken(): string {
    return this.ls.get('access_token') ?? '';
  }

  getModules(): ModulePermissions[] {
    return this.ls.get('modules') ?? [];
  }

  getTenantId(): string {
    return this.ls.get('tenant_id') ?? '';
  }
}
