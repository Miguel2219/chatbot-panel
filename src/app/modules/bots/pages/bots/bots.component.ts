import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';

import {BotService} from '../../services/bot.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {DeleteConfirmComponent} from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import {CreateBotComponent} from '../../modals/create-bot/create-bot.component';
import {ResponseBotDto} from '../../interfaces/bot.interface';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {ToastrService} from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';

@Component({
  selector: 'app-bots',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NgSelectModule, TableComponent],
  templateUrl: './bots.component.html',
})
export class BotsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Nombre',       key: 'name',                 isSortable: false, dataType: 'text' },
    { name: 'Descripción',  key: 'description',                            dataType: 'text' },
    { name: 'Estado',       key: 'is_active',                              dataType: 'boolean' },
    { name: 'Responsables', key: 'responsables_display',                   dataType: 'text' },
    { name: 'Creado',       key: 'created_at',           isSortable: false, dataType: 'date' },
  ];

  get actions(): TableActions {
    return {
      add: this._auth.hasPermission('bots', 'create'),
      edit: this._auth.hasPermission('bots', 'edit'),
      delete: this._auth.hasPermission('bots', 'delete'),
      search: true,
      customize: this._auth.hasPermission('bots', 'edit'),
    };
  }

  bots: Array<ResponseBotDto & { responsables_display: string }> = [];
  isLoading = true;
  lastParams: HttpParams = new HttpParams();
  totalElements: number = 0;
  isPageable: boolean = false;
  size: number = 0;
  pageIndex: number = 0

  isAdmin = false;
  tenants: Select[] = [];
  tenantFilterId: string | null = null;

  constructor(
    private _botService: BotService,
    private _tenantsService: TenantsService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _router: Router,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this._auth.isAdmin();
    if (this.isAdmin) {
      this._tenantsService.getTenantsSelect().subscribe({
        next: (tenants) => { this.tenants = tenants; },
      });
    }
    this.getBots(new HttpParams());
  }

  getBots(params: HttpParams): void {
    this.isLoading = true;
    this.lastParams = params;

    let merged = params;
    if (this.isAdmin && this.tenantFilterId) {
      merged = merged.set('tenantId', this.tenantFilterId);
    }
    this._botService.getBotsByTenant(merged).subscribe({
      next: (data) => {
        this.bots = data.content.map(b => ({
          ...b,
          responsables_display: (b.lead_assignees?.length)
            ? b.lead_assignees.map(a => a.full_name).join(', ')
            : 'No aplica',
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

  onTenantFilterChange(tenantId: string | null): void {
    this.tenantFilterId = tenantId;
    this.getBots(new HttpParams());
  }

  openCreateBot(): void {
    const ref = this._dialog.open(CreateBotComponent, {
      width: '520px',
      autoFocus: false,
      data: { mode: 'create' },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.getBots(this.lastParams);
    });
  }

  openEditBot(bot: ResponseBotDto): void {
    const ref = this._dialog.open(CreateBotComponent, {
      width: '520px',
      autoFocus: false,
      data: { mode: 'edit', bot },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.getBots(this.lastParams);
    });
  }

  openCustomizeBot(bot: ResponseBotDto): void {
    this._router.navigate(['/administration/bots', bot.bot_id, 'customize']);
  }

  deleteBot(bot: ResponseBotDto): void {
    const ref = this._dialog.open(DeleteConfirmComponent, {
      width: '440px',
      data: {
        legend: `¿Deseas eliminar el asistente "${bot.name}"?`,
        message: 'Esta acción eliminará también sus conversaciones y documentos asociados.',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this._loader.show();
      this._botService.deleteBot(bot.bot_id).subscribe({
        next: () => {
          this._loader.hide();
          this._toastr.success('Asistente eliminado correctamente');
          this.getBots(new HttpParams());
        },
        error: () => this._loader.hide(),
      });
    });
  }
}
