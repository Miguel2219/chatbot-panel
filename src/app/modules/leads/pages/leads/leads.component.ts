import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpParams} from '@angular/common/http';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

import {LeadService} from '../../services/lead.service';
import {BotService} from '../../../bots/services/bot.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {AuthService} from '../../../../core/services/auth.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {FilterPanelComponent} from '../../../../shared/components/filter-panel/filter-panel.component';
import {UpdateLeadStatusComponent} from '../../modals/update-lead-status/update-lead-status.component';
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
    { name: 'Nombre',            key: 'name',              isSortable: false, dataType: 'text'   },
    { name: 'Teléfono',          key: 'phone',                               dataType: 'text'   },
    { name: 'Email',             key: 'email',                               dataType: 'text'   },
    { name: 'Canal',             key: 'channel',                             dataType: 'text'   },
    { name: 'Asesor asignado',   key: 'assigned_adviser',                    dataType: 'text'   },
    { name: 'Estado',            key: 'status',                              dataType: 'status' },
    { name: 'Fecha',             key: 'created_at',        isSortable: false, dataType: 'date'   },
  ];

  get actions(): TableActions {
    return {
      add: false,
      edit: this._auth.hasPermission('leads', 'edit'),
      delete: false,
      search: true,
    };
  }

  leads: Array<LeadResponseDto & { assigned_adviser: string }> = [];
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
    private _leadService: LeadService,
    private _botService: BotService,
    private _tenantsService: TenantsService,
    private _auth: AuthService,
    private _dialog: MatDialog,
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
    if (this.activeFilters.botId) {
      merged = merged.set('botId', this.activeFilters.botId);
    }
    this.isLoading = true;
    this._leadService.getLeads(merged).subscribe({
      next: (data) => {
        this.leads = data.content.map(l => ({
          ...l,
          // Fallback explícito para leads sin adviser asignado (p.ej. leads
          // de WhatsApp, o el lead quedó sin assignee por limpieza posterior
          // del user). Sin esto la columna queda vacía y confunde al asesor.
          assigned_adviser: l.assigned_adviser?.trim() ? l.assigned_adviser : 'Sin asignar',
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
    this.loadLeads(this.lastTableParams);
  }

  onFiltersCleared(): void {
    this.activeFilters = { tenantId: null, botId: null };
    this.filterBots = [];
    this.isFilterPanelOpen = false;
    this.loadLeads(this.lastTableParams);
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

  openUpdateStatus(lead: LeadResponseDto): void {
    const ref = this._dialog.open(UpdateLeadStatusComponent, {
      width: '400px',
      data: { lead },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadLeads(this.lastTableParams);
    });
  }
}
