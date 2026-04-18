import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

import { DocumentService } from '../../services/document.service';
import { BotService } from '../../../bots/services/bot.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { TableComponent } from '../../../../shared/layouts/table/table.component';
import { DeleteConfirmComponent } from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import { UploadDocumentComponent } from '../../modals/upload-document/upload-document.component';
import { DocumentResponseDto } from '../../interfaces/document.interface';
import { TableColumn, TableActions } from '../../../../core/interfaces/table.interface';
import { Select } from '../../../../core/interfaces/select.interface';
import { ToastrService } from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TableComponent, NgSelectModule],
  templateUrl: './documents.component.html',
})
export class DocumentsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Nombre',  key: 'file_name',  isSortable: true, dataType: 'text' },
    { name: 'Tipo',    key: 'file_type',                    dataType: 'text' },
    { name: 'Tamaño (MB)', key: 'file_size',                dataType: 'text' },
    { name: 'Subido',  key: 'created_at', isSortable: true, dataType: 'date' },
  ];

  actions: TableActions = { add: true, edit: true, delete: true, search: false };

  bots: Select[] = [];
  documents: DocumentResponseDto[] = [];
  selectedBotId = '';
  isInitializing = true;
  isLoading = false;
  size: number = 0;
  isPageable: boolean = false;
  pageIndex: number = 0
  totalElements: number = 0;

  constructor(
    private _documentService: DocumentService,
    private _botService: BotService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this._botService.getBotsByTenantSelect().subscribe({
      next: (bots) => {
        this.bots = bots;
        this.isInitializing = false;
        if (bots.length > 0) {
          this.selectedBotId = bots[0].value;
          this.loadDocuments(new HttpParams());
        }
      },
      error: () => { this.isInitializing = false; },
    });
  }

  onBotChange(): void {
    if (this.selectedBotId) this.loadDocuments(new HttpParams());
  }

  loadDocuments(params: HttpParams): void {
    this.isLoading = true;
    this._documentService.getDocumentsByBot(this.selectedBotId, params).subscribe({
      next: (data) => {
        this.documents = data.content.map(doc => ({
          ...doc,
          file_size: Math.round(doc.file_size / (1024 * 1024) * 100) / 100,
        }));
        this.totalElements = data.totalElements;
        this.size = data.size;
        this.pageIndex = data.number;
        this.isPageable = this.totalElements > this.size;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  openUpload(): void {
    const ref = this._dialog.open(UploadDocumentComponent, {
      width: '520px',
      data: { botId: this.selectedBotId },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadDocuments(new HttpParams());
    });
  }

  deleteDocument(doc: DocumentResponseDto): void {
    const ref = this._dialog.open(DeleteConfirmComponent, {
      width: '440px',
      data: {
        legend: `¿Deseas eliminar "${doc.file_name}"?`,
        message: 'Se eliminará de la base de conocimiento del bot.',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this._loader.show();
      this._documentService.deleteDocument(doc.document_id).subscribe({
        next: () => {
          this._loader.hide();
          this._toastr.success('Documento eliminado correctamente');
          this.loadDocuments(new HttpParams());
        },
        error: () => this._loader.hide(),
      });
    });
  }
}
