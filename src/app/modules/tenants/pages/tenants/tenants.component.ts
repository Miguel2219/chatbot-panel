import {Component, OnInit} from '@angular/core';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {HttpParams} from '@angular/common/http';
import {MatDialog} from '@angular/material/dialog';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {TenantsService} from '../../services/tenants.service';
import {TenantResponse} from '../../interfaces/tenant.interface';
import {AuthService} from '../../../../core/services/auth.service';
import {CreateTenantComponent} from '../../modals/create-tenant/create-tenant.component';
import {EditTenantComponent} from '../../modals/edit-tenant/edit-tenant.component';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    TableComponent
  ],
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss'
})
export class TenantsComponent implements OnInit {
  isLoading = true;
  lastParams: HttpParams = new HttpParams();
  totalElements: number = 0;
  isPageable: boolean = false;
  size: number = 0;
  pageIndex: number = 0
  tenants: TenantResponse[] = []

  get actions(): TableActions {
    return {
      add: this._auth.hasPermission('tenants', 'create'),
      edit: this._auth.isAdmin(),
      delete: false,
      search: true,
    };
  }

  tableColumns: TableColumn[] = [
    { name: 'Nombre',      key: 'name',        isSortable: false, dataType: 'text' },
    { name: 'Descripción', key: 'email',               dataType: 'text' },
    { name: 'Estado',      key: 'is_active',                  dataType: 'boolean' },
    { name: 'Tipo de implementación',      key: 'implementation_type',   isSortable: false, dataType: 'text' },
    { name: 'Creado',      key: 'created_at',   isSortable: false, dataType: 'date' },
  ];

  constructor(
    private _tenantService: TenantsService,
    private _dialog: MatDialog,
    private _auth: AuthService,
  ) {
  }

  ngOnInit() {
    this.getTenants(new HttpParams());
  }

  openCreateTenant(): void {
    if (!this._auth.hasPermission('tenants', 'create')) return;
    const ref = this._dialog.open(CreateTenantComponent, { width: '620px', autoFocus: false });
    ref.afterClosed().subscribe((result) => {
      if (result) this.getTenants(this.lastParams);
    });
  }

  openEditTenant(tenant: TenantResponse): void {
    if (!this._auth.isAdmin()) return;
    const ref = this._dialog.open(EditTenantComponent, {
      width: '620px',
      autoFocus: false,
      data: {tenant},
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.getTenants(this.lastParams);
    });
  }

  getTenants(params: HttpParams): void {
    this.isLoading = true;
    this.lastParams = params;
    this._tenantService.getTenants(params).subscribe({
      next: (data) => {
        this.tenants = data.content;
        this.totalElements = data.totalElements;
        this.size = data.size;
        this.pageIndex = data.number;
        this.isPageable = this.totalElements > this.size;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }


}
