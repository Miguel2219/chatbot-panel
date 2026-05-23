import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpParams} from '@angular/common/http';
import {MatIconModule} from '@angular/material/icon';

import {LeadService} from '../../services/lead.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {AuthService} from '../../../../core/services/auth.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {FilterPanelComponent} from '../../../../shared/components/filter-panel/filter-panel.component';
import {LeadResponseDto} from '../../interfaces/lead.interface';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {FilterParams} from '../../../../shared/interfaces/filter-params.interface';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, MatIconModule, TableComponent, FilterPanelComponent],
  templateUrl: './leads.component.html',
})
export class LeadsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Nombre',          key: 'name',             isSortable: false, dataType: 'text'     },
    { name: 'Teléfono',        key: 'phone',                               dataType: 'text'     },
    { name: 'Email',           key: 'email',                               dataType: 'text'     },
    { name: 'Capturas',        key: 'capture_count',                       dataType: 'text'     },
    { name: 'Última captura',  key: 'last_captured_at',                    dataType: 'dateTime' },
    { name: 'Fecha',           key: 'created_at',       isSortable: false, dataType: 'date'     },
  ];

  get actions(): TableActions {
    return {
      add: false,
      edit: false,
      delete: false,
      search: true,
    };
  }

  leads: LeadResponseDto[] = [];
  isInitializing = true;
  isLoading = false;
  totalElements = 0;
  size = 0;
  pageIndex = 0;
  isPageable = false;

  isFilterPanelOpen = false;
  isAdmin = false;
  tenants: Select[] = [];
  activeFilters: FilterParams = { tenantId: null, botId: null };

  private lastTableParams: HttpParams = new HttpParams();

  constructor(
    private _leadService: LeadService,
    private _tenantsService: TenantsService,
    private _auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this._auth.isAdmin();
    if (this.isAdmin) {
      this._tenantsService.getTenantsSelect().subscribe({
        next: (tenants) => { this.tenants = tenants; },
      });
    }
    this.loadLeads(new HttpParams());
  }

  loadLeads(params: HttpParams): void {
    this.lastTableParams = params;
    let merged = params;
    if (this.activeFilters.tenantId) {
      merged = merged.set('tenantId', this.activeFilters.tenantId);
    }
    this.isLoading = true;
    this._leadService.getLeads(merged).subscribe({
      next: (data) => {
        this.leads = data.content;
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

  onFiltersApplied(filters: FilterParams): void {
    this.activeFilters = filters;
    this.isFilterPanelOpen = false;
    this.loadLeads(this.lastTableParams);
  }

  onFiltersCleared(): void {
    this.activeFilters = { tenantId: null, botId: null };
    this.isFilterPanelOpen = false;
    this.loadLeads(this.lastTableParams);
  }

  hasActiveFilters(): boolean {
    return !!this.activeFilters.tenantId;
  }

  activeFilterCount(): number {
    return this.activeFilters.tenantId ? 1 : 0;
  }
}
