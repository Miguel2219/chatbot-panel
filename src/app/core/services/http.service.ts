import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Observable } from 'rxjs';
import { HttpOptions } from '../interfaces/http-options.interface';
import { CLEAR_AUTHORIZATION } from '../interceptors/auth-interceptor/auth.interceptor';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: any
  ) {}

  public get<T>(url: string, clearAuthorization = false, httpOptions?: HttpOptions): Observable<T> {
    const options = this.buildOptions(clearAuthorization, httpOptions);
    return this.http.get<T>(url, options);
  }

  public post<T, R>(url: string, body: T, clearAuthorization = false, httpOptions?: HttpOptions): Observable<R> {
    const options = this.buildOptions(clearAuthorization, httpOptions);
    return this.http.post<R>(url, body, options);
  }

  public put<T, R>(url: string, body: T, clearAuthorization = false, httpOptions?: HttpOptions): Observable<R> {
    const options = this.buildOptions(clearAuthorization, httpOptions);
    return this.http.put<R>(url, body, options);
  }

  public delete<R>(url: string, clearAuthorization = false, httpOptions?: HttpOptions): Observable<R> {
    const options = this.buildOptions(clearAuthorization, httpOptions);
    return this.http.delete<R>(url, options);
  }

  public postFormData<R>(url: string, formData: FormData): Observable<R> {
    const token = this.getTokenFromStorage();
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
    });
    return this.http.post<R>(url, formData, { headers });
  }

  public addParams(params: HttpParams): HttpOptions {
    return {
      headers: this.defaultHeaders(),
      params,
    };
  }

  private buildOptions(clearAuthorization: boolean, httpOptions?: HttpOptions): HttpOptions {
    const defaultOptions: HttpOptions = {
      headers: this.defaultHeaders(),
      context: new HttpContext().set(CLEAR_AUTHORIZATION, clearAuthorization),
    };

    if (!httpOptions) return defaultOptions;

    return {
      params: httpOptions.params ?? defaultOptions.params,
      headers: httpOptions.headers ?? defaultOptions.headers,
      context: httpOptions.context ?? defaultOptions.context,
    };
  }

  private defaultHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': this.document.location.origin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT',
    });
  }

  private getTokenFromStorage(): string {
    try {
      return localStorage.getItem('access_token') ?? '';
    } catch {
      return '';
    }
  }
}
