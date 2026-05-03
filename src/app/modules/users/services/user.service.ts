import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {CreateUserRequest, UpdateUserRequest, UserResponse} from '../interfaces/user.interface';
import {HttpParams} from '@angular/common/http';
import {Page} from '../../../core/interfaces/page.interface';
import {Select} from '../../../core/interfaces/select.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private _http: HttpService) {}

  getUsers(params: HttpParams): Observable<Page<UserResponse>> {
    const defaultOptions = this._http.addParams(params)
    return this._http.get<Page<UserResponse>>(EndPoints.USERS, false, defaultOptions);
  }

  createUser(data: CreateUserRequest): Observable<void> {
    return this._http.post<CreateUserRequest, void>(EndPoints.USERS, data);
  }

  updateUser(userId: string, data: UpdateUserRequest): Observable<void> {
    return this._http.put<UpdateUserRequest, void>(EndPoints.USERS + '/' + userId, data);
  }

  deleteUser(userId: string): Observable<void> {
    return this._http.delete<void>(EndPoints.USERS + '/' + userId);
  }

  getUsersWithoutTenant(): Observable<UserResponse[]> {
    return this._http.get<UserResponse[]>(EndPoints.USERS_WITHOUT_TENANT);
  }

  getUsersWithoutTenantSelect(): Observable<Select[]> {
    return new Observable<Select[]>((observer) => {
      this.getUsersWithoutTenant().subscribe({
        next: (users) => {
          observer.next(users.map((u): Select => ({
            label: `${u.name ?? ''} ${u.lastname ?? ''}`.trim() + ` (${u.email})`,
            value: u.user_id,
          })));
          observer.complete();
        },
      });
    });
  }
}
