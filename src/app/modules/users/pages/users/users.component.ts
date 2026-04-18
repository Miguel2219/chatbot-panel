import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

import {UserService} from '../../services/user.service';
import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {DeleteConfirmComponent} from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import {CreateUserComponent} from '../../modals/create-user/create-user.component';
import {AdviserResponseDto, UserResponse} from '../../interfaces/user.interface';
import {TableColumn, TableActions} from '../../../../core/interfaces/table.interface';
import {ToastrService} from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, TableComponent],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {

  tableColumns: TableColumn[] = [
    {name: 'Nombre', key: 'name', isSortable: true, dataType: 'text'},
    {name: 'Apellido', key: 'lastname', dataType: 'text'},
    {name: 'Email', key: 'email', isSortable: true, dataType: 'text'},
    {name: 'Roles', key: 'roles', dataType: 'badge'},
    {name: 'Tenant', key: 'tenant_name', dataType: 'text'},
    {name: 'Canal de notificación', key: 'notification_channel', dataType: 'text'},
  ];

  actions: TableActions = {add: true, edit: false, delete: true, search: true};

  users: UserResponse[] = [];
  isLoading = true;
  lastParams: HttpParams = new HttpParams();
  totalElements: number = 0;
  isPageable: boolean = false;
  size: number = 0;
  pageIndex: number = 0

  constructor(
    private _userService: UserService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _toastr: ToastrService,
  ) {
  }

  ngOnInit(): void {
    this.loadUsers(new HttpParams());
  }

  loadUsers(params: HttpParams): void {
    this.isLoading = true;
    this.lastParams = params
    this._userService.getUsers(params).subscribe({
      next: (data) => {
        this.users = data.content;
        console.log(this.users)
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

  deleteUser(user: AdviserResponseDto): void {
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
      this._userService.deleteAdviser(user.userId).subscribe({
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
