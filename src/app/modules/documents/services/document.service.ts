import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { EndPoints } from '../../../core/utils/endpoints';
import { DocumentResponseDto } from '../interfaces/document.interface';
import {Page} from '../../../core/interfaces/page.interface';
import {HttpParams} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private _http: HttpService) {}

  getDocumentsByBot(botId: string, params: HttpParams): Observable<Page<DocumentResponseDto>> {
    const defaultOptions = this._http.addParams(params);
    return this._http.get<Page<DocumentResponseDto>>(EndPoints.DOCUMENTS + botId, false, defaultOptions);
  }

  uploadDocuments(botId: string, files: File[]): Observable<DocumentResponseDto[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this._http.postFormData<DocumentResponseDto[]>(EndPoints.DOCUMENTS + botId, formData);
  }

  deleteDocument(documentId: string): Observable<void> {
    return this._http.delete<void>(EndPoints.DOCUMENTS + documentId);
  }
}
