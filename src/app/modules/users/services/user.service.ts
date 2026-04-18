import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {AdviserResponseDto, CreateAdviserRequestDto, UserResponse} from '../interfaces/user.interface';
import {HttpParams} from '@angular/common/http';
import {Page} from '../../../core/interfaces/page.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private _http: HttpService) {}

  getUsers(params: HttpParams): Observable<Page<UserResponse>> {
    const defaultOptions = this._http.addParams(params)
    return this._http.get<Page<UserResponse>>(EndPoints.USERS, false, defaultOptions);
  }
  createAdviser(tenantId: string, data: CreateAdviserRequestDto): Observable<AdviserResponseDto> {
    return this._http.post<CreateAdviserRequestDto, AdviserResponseDto>(
      EndPoints.ADVISER_CREATE + tenantId,
      data
    );
  }

  deleteAdviser(adviserId: string): Observable<void> {
    return this._http.delete<void>(EndPoints.ADVISER_DELETE + adviserId);
  }
}
