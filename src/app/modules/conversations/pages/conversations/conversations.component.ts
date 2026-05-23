import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpParams} from '@angular/common/http';
import {MatIconModule} from '@angular/material/icon';

import {ConversationService} from '../../services/conversation.service';
import {BotService} from '../../../bots/services/bot.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {AuthService} from '../../../../core/services/auth.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {FilterPanelComponent} from '../../../../shared/components/filter-panel/filter-panel.component';
import {ConversationThreadSummaryDto} from '../../interfaces/conversation.interface';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {FilterParams} from '../../../../shared/interfaces/filter-params.interface';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, MatIconModule, TableComponent, FilterPanelComponent],
  templateUrl: './conversations.component.html',
})
export class ConversationsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Cliente',          key: 'customer_name',            isSortable: false, dataType: 'text'     },
    { name: 'Canal',            key: 'channel',                  isSortable: false, dataType: 'badge'    },
    { name: 'Estado',           key: 'status',                   isSortable: false, dataType: 'badge'    },
    { name: 'Asesor',           key: 'assigned_adviser_name',    isSortable: false, dataType: 'text'     },
    { name: 'Última actividad', key: 'last_customer_message_at',                    dataType: 'dateTime' },
  ];

  actions: TableActions = { add: false, edit: false, delete: false, search: true };

  conversations: ConversationThreadSummaryDto[] = [];
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
    private _conversationService: ConversationService,
    private _botService: BotService,
    private _tenantsService: TenantsService,
    private _auth: AuthService,
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
    this.loadConversations(new HttpParams());
  }

  loadConversations(params: HttpParams): void {
    this.lastTableParams = params;
    let merged = params;
    if (this.activeFilters.tenantId) {
      merged = merged.set('tenantId', this.activeFilters.tenantId);
    }
    if (this.activeFilters.botId) {
      merged = merged.set('botId', this.activeFilters.botId);
    }
    this.isLoading = true;
    this._conversationService.getConversations(merged).subscribe({
      next: (data) => {
        this.conversations = data.content;
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
    this.loadConversations(this.lastTableParams);
  }

  onFiltersCleared(): void {
    this.activeFilters = { tenantId: null, botId: null };
    this.filterBots = [];
    this.isFilterPanelOpen = false;
    this.loadConversations(this.lastTableParams);
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
}
