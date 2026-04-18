import {Component, OnInit} from '@angular/core';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {HttpParams} from '@angular/common/http';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {TenantsService} from '../../services/tenants.service';
import {TenantResponse} from '../../interfaces/tenant.interface';

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

  actions: TableActions = { add: true, edit: false, delete: true, search: true };

  tableColumns: TableColumn[] = [
    { name: 'Nombre',      key: 'name',        isSortable: true, dataType: 'text' },
    { name: 'Descripción', key: 'email',               dataType: 'text' },
    { name: 'Estado',      key: 'is_active',                  dataType: 'boolean' },
    { name: 'Tipo de implementación',      key: 'implementation_type',   isSortable: true, dataType: 'text' },
    { name: 'Creado',      key: 'created_at',   isSortable: true, dataType: 'date' },
  ];

  constructor(private _tenantService: TenantsService) {
  }

  ngOnInit() {
    this.getTenants(new HttpParams());
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
