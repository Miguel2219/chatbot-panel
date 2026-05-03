import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpParams} from '@angular/common/http';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ToastrService} from 'ngx-toastr';

import {DocumentService} from '../../services/document.service';
import {BotService} from '../../../bots/services/bot.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {FilterPanelComponent} from '../../../../shared/components/filter-panel/filter-panel.component';
import {DeleteConfirmComponent} from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import {UploadDocumentComponent} from '../../modals/upload-document/upload-document.component';
import {DocumentResponseDto} from '../../interfaces/document.interface';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {FilterParams} from '../../../../shared/interfaces/filter-params.interface';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, MatIconModule, TableComponent, FilterPanelComponent],
  templateUrl: './documents.component.html',
})
export class DocumentsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Nombre',       key: 'file_name',  isSortable: false, dataType: 'text' },
    { name: 'Tipo',         key: 'file_type',                    dataType: 'text' },
    { name: 'Tamaño (MB)',  key: 'file_size',                    dataType: 'text' },
    { name: 'Subido',       key: 'created_at', isSortable: false, dataType: 'date' },
  ];

  get actions(): TableActions {
    return {
      add: this._auth.hasPermission('documents', 'create'),
      edit: false,
      delete: this._auth.hasPermission('documents', 'delete'),
      search: false,
    };
  }

  documents: DocumentResponseDto[] = [];
  isInitializing = true;
  isLoading = false;
  totalElements = 0;
  size = 0;
  pageIndex = 0;
  isPageable = false;

  isFilterPanelOpen = false;
  isAdmin = false;
  tenants: Select[] = [];
  filterBots: Select[] = [];
  isLoadingFilterBots = false;
  activeFilters: FilterParams = { tenantId: null, botId: null };

  private lastTableParams: HttpParams = new HttpParams();

  constructor(
    private _documentService: DocumentService,
    private _botService: BotService,
    private _tenantsService: TenantsService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this._auth.isAdmin();
    if (this.isAdmin) {
      this._tenantsService.getTenantsSelect().subscribe({
        next: (tenants) => { this.tenants = tenants; },
      });
    } else {
      this.isLoadingFilterBots = true;
      this._botService.getBotsByTenantSelect().subscribe({
        next: (bots) => { this.filterBots = bots; this.isLoadingFilterBots = false; },
        error: () => { this.isLoadingFilterBots = false; },
      });
    }
    this.loadDocuments(new HttpParams());
  }

  loadDocuments(params: HttpParams): void {
    this.lastTableParams = params;
    let merged = params;
    if (this.activeFilters.tenantId) {
      merged = merged.set('tenantId', this.activeFilters.tenantId);
    }
    if (this.activeFilters.botId) {
      merged = merged.set('botId', this.activeFilters.botId);
    }
    this.isLoading = true;
    this._documentService.getDocuments(merged).subscribe({
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
        this.isInitializing = false;
      },
      error: () => { this.isLoading = false; this.isInitializing = false; },
    });
  }

  openFilterPanel(): void  { this.isFilterPanelOpen = true;  }
  closeFilterPanel(): void { this.isFilterPanelOpen = false; }

  onTenantSelected(tenantId: string): void {
    this.isLoadingFilterBots = true;
    this._botService.getBotsByTenantId(tenantId).subscribe({
      next: (bots) => { this.filterBots = bots; this.isLoadingFilterBots = false; },
      error: () => { this.isLoadingFilterBots = false; },
    });
  }

  onFiltersApplied(filters: FilterParams): void {
    this.activeFilters = filters;
    this.isFilterPanelOpen = false;
    this.loadDocuments(this.lastTableParams);
  }

  onFiltersCleared(): void {
    this.activeFilters = { tenantId: null, botId: null };
    this.filterBots = [];
    this.isFilterPanelOpen = false;
    this.loadDocuments(this.lastTableParams);
  }

  hasActiveFilters(): boolean {
    return !!(this.activeFilters.tenantId || this.activeFilters.botId);
  }

  activeFilterCount(): number {
    let n = 0;
    if (this.activeFilters.tenantId) n++;
    if (this.activeFilters.botId) n++;
    return n;
  }

  openUpload(): void {
    // El modal es autónomo: resuelve tenant+bot por su cuenta (admin ve
    // selectores, non-admin toma el propio). Los filtros de la tabla NO
    // son gate de creación.
    const ref = this._dialog.open(UploadDocumentComponent, {
      width: '560px',
      autoFocus: false,
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadDocuments(this.lastTableParams);
    });
  }

  deleteDocument(doc: DocumentResponseDto): void {
    const ref = this._dialog.open(DeleteConfirmComponent, {
      width: '440px',
      data: {
        legend: `¿Deseas eliminar "${doc.file_name}"?`,
        message: 'Se eliminará de la base de conocimiento del asistente.',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this._loader.show();
      this._documentService.deleteDocument(doc.document_id).subscribe({
        next: () => {
          this._loader.hide();
          this._toastr.success('Documento eliminado correctamente');
          this.loadDocuments(this.lastTableParams);
        },
        error: () => this._loader.hide(),
      });
    });
  }
}
