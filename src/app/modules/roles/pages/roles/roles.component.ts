import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ToastrService} from 'ngx-toastr';

import {RoleService} from '../../services/role.service';
import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {DeleteConfirmComponent} from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import {CreateRoleComponent} from '../../modals/create-role/create-role.component';
import {ModulePermissionsRole, PermissionCheck, RoleResponse} from '../../interfaces/role.interface';
import {RoleLabelPipe} from '../../../../shared/pipes/role-label.pipe';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, MatIconModule, RoleLabelPipe],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {

  roles: RoleResponse[] = [];
  selectedRole: RoleResponse | null = null;
  modulePermissions: ModulePermissionsRole[] = [];

  isLoadingRoles = true;
  isLoadingPermissions = false;
  isSaving = false;

  readonly ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE'];

  private readonly MODULE_LABELS: Record<string, string> = {
    dashboard:       'Dashboard',
    bots:            'Asistentes',
    leads:           'Contactos',
    conversations:   'Conversaciones',
    documents:       'Documentos',
    users:           'Usuarios',
    'whatsapp-config': 'WhatsApp Config',
    tenants:         'Tenants',
    roles:           'Roles',
  };

  private readonly MODULE_ICONS: Record<string, string> = {
    dashboard:       'dashboard',
    bots:            'smart_toy',
    leads:           'contacts',
    conversations:   'forum',
    documents:       'description',
    users:           'group',
    'whatsapp-config': 'whatsapp',
    tenants:         'business',
    roles:           'shield',
  };

  private readonly ROLE_COLORS = [
    'violet', 'blue', 'green', 'amber', 'cyan',
  ];

  constructor(
    private _roleService: RoleService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _toastr: ToastrService,
  ) {}

  get canCreate(): boolean { return this._auth.hasPermission('roles', 'create'); }
  get canEdit(): boolean   { return this._auth.hasPermission('roles', 'edit'); }
  get canDelete(): boolean { return this._auth.hasPermission('roles', 'delete'); }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoadingRoles = true;
    this._roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoadingRoles = false;
        if (this.selectedRole) {
          const updated = roles.find(r => r.role_id === this.selectedRole!.role_id);
          if (updated) {
            this.selectedRole = updated;
          }
        }
      },
      error: () => { this.isLoadingRoles = false; },
    });
  }

  selectRole(role: RoleResponse): void {
    if (this.selectedRole?.role_id === role.role_id) return;
    this.selectedRole = role;
    this.modulePermissions = [];
    this.isLoadingPermissions = true;
    this._roleService.getPermissionsByRole(role.role_id).subscribe({
      next: (data) => {
        this.modulePermissions = data;
        this.isLoadingPermissions = false;
      },
      error: () => { this.isLoadingPermissions = false; },
    });
  }

  getPermission(module: ModulePermissionsRole, action: string): PermissionCheck | undefined {
    return module.permissions.find(p => p.action === action);
  }

  togglePermission(perm: PermissionCheck): void {
    perm.granted = !perm.granted;
  }

  savePermissions(): void {
    if (!this.selectedRole) return;
    const grantedIds = this.modulePermissions
      .flatMap(m => m.permissions)
      .filter(p => p.granted)
      .map(p => p.permission_id);

    this.isSaving = true;
    this._loader.show();
    this._roleService.updateRolePermissions(this.selectedRole.role_id, { permission_ids: grantedIds }).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Permisos actualizados correctamente');
        this.isSaving = false;
      },
      error: () => {
        this._loader.hide();
        this.isSaving = false;
      },
    });
  }

  openCreateRole(): void {
    const ref = this._dialog.open(CreateRoleComponent, {
      width: '480px',
      autoFocus: false,
      data: null,
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadRoles();
    });
  }

  openEditRole(role: RoleResponse, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this._dialog.open(CreateRoleComponent, {
      width: '480px',
      autoFocus: false,
      data: role,
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadRoles();
    });
  }

  deleteRole(role: RoleResponse, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this._dialog.open(DeleteConfirmComponent, {
      width: '440px',
      data: {
        legend: `¿Deseas eliminar el rol "${role.name}"?`,
        message: 'Los usuarios con este rol perderán sus permisos asociados.',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this._loader.show();
      this._roleService.deleteRole(role.role_id).subscribe({
        next: () => {
          this._loader.hide();
          this._toastr.success('Rol eliminado correctamente');
          if (this.selectedRole?.role_id === role.role_id) {
            this.selectedRole = null;
            this.modulePermissions = [];
          }
          this.loadRoles();
        },
        error: () => this._loader.hide(),
      });
    });
  }

  getRoleColor(roleId: string): string {
    const sum = roleId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return this.ROLE_COLORS[sum % this.ROLE_COLORS.length];
  }

  getModuleLabel(name: string): string {
    return this.MODULE_LABELS[name] ?? name;
  }

  getModuleIcon(name: string): string {
    return this.MODULE_ICONS[name] ?? 'apps';
  }

  getGrantedCount(module: ModulePermissionsRole): number {
    return module.permissions.filter(p => p.granted).length;
  }

  getTotalGranted(): number {
    return this.modulePermissions
      .flatMap(m => m.permissions)
      .filter(p => p.granted).length;
  }

  getTotalPermissions(): number {
    return this.modulePermissions.flatMap(m => m.permissions).length;
  }
}
