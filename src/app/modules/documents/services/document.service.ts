import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {HttpService} from '../../../core/services/http.service';
import {EndPoints} from '../../../core/utils/endpoints';
import {DocumentResponseDto} from '../interfaces/document.interface';
import {Page} from '../../../core/interfaces/page.interface';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private _http: HttpService) {}

  getDocuments(params: HttpParams): Observable<Page<DocumentResponseDto>> {
    const options = this._http.addParams(params);
    return this._http.get<Page<DocumentResponseDto>>(EndPoints.DOCUMENTS, false, options);
  }

  uploadDocuments(botId: string, files: File[]): Observable<DocumentResponseDto[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this._http.postFormData<DocumentResponseDto[]>(EndPoints.DOCUMENT_UPLOAD + botId, formData);
  }

  deleteDocument(documentId: string): Observable<void> {
    return this._http.delete<void>(EndPoints.DOCUMENT_DELETE + documentId);
  }
}
