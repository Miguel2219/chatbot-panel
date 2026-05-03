import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';

import {UserService} from '../../services/user.service';
import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {DeleteConfirmComponent} from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import {CreateUserComponent} from '../../modals/create-user/create-user.component';
import {UserResponse} from '../../interfaces/user.interface';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {ToastrService} from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';
import {RoleLabelPipe} from '../../../../shared/pipes/role-label.pipe';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {Select} from '../../../../core/interfaces/select.interface';
import {FormsModule} from '@angular/forms';

type UserRow = UserResponse & {roles_label: string};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, TableComponent, NgSelectModule, FormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {

  tableColumns: TableColumn[] = [
    {name: 'Nombre', key: 'name', isSortable: false, dataType: 'text'},
    {name: 'Apellido', key: 'lastname', dataType: 'text'},
    {name: 'Email', key: 'email', isSortable: false, dataType: 'text'},
    {name: 'Roles', key: 'roles_label', dataType: 'text'},
    {name: 'Tenant', key: 'tenant_name', dataType: 'text'},
    {name: 'Canal de notificación', key: 'notification_channel', dataType: 'text'},
  ];

  get actions(): TableActions {
    return {
      add: this._auth.hasPermission('users', 'create'),
      edit: this._auth.hasPermission('users', 'edit'),
      delete: this._auth.hasPermission('users', 'delete'),
      search: true,
    };
  }

  get subtitle(): string {
    return this._auth.isAdmin()
      ? 'Gestiona los usuarios de la plataforma'
      : 'Gestiona los usuarios de tu empresa';
  }

  users: UserRow[] = [];
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
    private _userService: UserService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _toastr: ToastrService,
    private _tenantService: TenantsService,
  ) {
  }

  ngOnInit(): void {
    this.isAdmin = this._auth.isAdmin();
    if (this.isAdmin) {
      this._tenantService.getTenantsSelect().subscribe({
        next: (tenants) => {
          this.tenants = tenants;
        }
      })
    }
    this.loadUsers(new HttpParams());
  }

  loadUsers(params: HttpParams): void {
    this.isLoading = true;
    this.lastParams = params
    let merged: HttpParams = params;
    if (this.isAdmin && this.tenantFilterId) {
      merged = merged.set('tenantId', this.tenantFilterId)
    }
    this._userService.getUsers(merged).subscribe({
      next: (data) => {
        this.users = data.content.map(u => ({
          ...u,
          roles_label: (u.roles ?? []).map(RoleLabelPipe.label).join(', '),
        }));
        this.totalElements = data.totalElements;
        this.size = data.size;
        this.pageIndex = data.number;
        this.isPageable = this.totalElements > this.size;
        this.isLoading = false;
      },
    });
  }

  openCreateUser(): void {
    const ref = this._dialog.open(CreateUserComponent, {width: '560px', autoFocus: false});
    ref.afterClosed().subscribe(result => {
      if (result) this.loadUsers(new HttpParams());
    });
  }

  onTenantFilterChange(tenantId: string | null): void {
    this.tenantFilterId = tenantId;
    this.loadUsers(new HttpParams());
  }

  openEditUser(user: UserResponse): void {
    const ref = this._dialog.open(CreateUserComponent, {
      width: '560px',
      autoFocus: false,
      data: { mode: 'edit', user },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadUsers(this.lastParams);
    });
  }

  deleteUser(user: UserResponse): void {
    const ref = this._dialog.open(DeleteConfirmComponent, {
      width: '440px',
      data: {
        legend: `¿Deseas eliminar al usuario "${user.email}"?`,
        message: 'Esta acción no se puede deshacer.',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this._loader.show();
      this._userService.deleteUser(user.user_id).subscribe({
        next: () => {
          this._loader.hide();
          this._toastr.success('Usuario eliminado correctamente');
          this.loadUsers(new HttpParams());
        },
        error: () => this._loader.hide(),
      });
    });
  }
}
