import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';
import { EndPoints } from '../utils/endpoints';
import { LoginRequest, LoginResponse } from '../../modules/auth/interfaces/auth.interface';
import {UserResponse} from '../../modules/users/interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private _http: HttpService,
    private _storage: StorageService,
    private _router: Router,
  ) {}

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this._http.post<LoginRequest, LoginResponse>(EndPoints.LOGIN, credentials, true);
  }

  public loginSuccess(response: LoginResponse): void {
    this._storage.saveSession(response);
    this._router.navigateByUrl('/administration/dashboard');
  }

  public isLoggedIn(): boolean {
    const token = this._storage.getToken();
    return !!token && token !== '';
  }

  public logout(): void {
    this._storage.removeAll();
    sessionStorage.clear();
    this._router.navigateByUrl('/auth');
  }

  public getUser(): UserResponse {
    return this._storage.getItem('user');
  }

  public getTenantId(): string {
    return this._storage.getTenantId();
  }
}
