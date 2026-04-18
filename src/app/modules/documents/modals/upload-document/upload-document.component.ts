import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { DocumentService } from '../../services/document.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-upload-document',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './upload-document.component.html',
})
export class UploadDocumentComponent {

  selectedFiles: File[] = [];
  isLoading = false;

  constructor(
    private _dialogRef: MatDialogRef<UploadDocumentComponent>,
    private _documentService: DocumentService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: { botId: string },
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  submit(): void {
    if (this.selectedFiles.length === 0) {
      this._toastr.warning('Selecciona al menos un archivo');
      return;
    }
    this.isLoading = true;
    this._loader.show();

    this._documentService.uploadDocuments(this.data.botId, this.selectedFiles).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Documento(s) subidos correctamente');
        this._dialogRef.close(true);
      },
      error: () => {
        this._loader.hide();
        this.isLoading = false;
      },
    });
  }

  close(): void {
    this._dialogRef.close(false);
  }
}
