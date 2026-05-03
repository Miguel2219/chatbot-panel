import {Inject, Injectable} from '@angular/core';
import {HttpClient, HttpContext, HttpHeaders, HttpParams} from '@angular/common/http';
import {DOCUMENT} from '@angular/common';
import {Observable} from 'rxjs';
import {HttpOptions} from '../interfaces/http-options.interface';
import {CLEAR_AUTHORIZATION} from '../interceptors/auth-interceptor/auth.interceptor';

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
    // CORS se controla EXCLUSIVAMENTE desde el backend (CorsConfig.java).
    // Los headers `Access-Control-*` NO se mandan desde el cliente — son
    // response headers del server al browser durante el preflight.
    // Mandarlos desde el front dispara un preflight innecesario y, si el
    // server tiene una whitelist explícita de allowed-headers (como la
    // nuestra), el browser cancela la request real.
    return new HttpHeaders({
      'Content-Type': 'application/json',
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
