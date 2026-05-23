import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';
import {ToastrService} from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';
import {Subject, takeUntil} from 'rxjs';

import {UserService} from '../../services/user.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {AuthService} from '../../../../core/services/auth.service';
import {RoleService} from '../../../roles/services/role.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {CreateUserRequest, UpdateUserRequest, UserResponse} from '../../interfaces/user.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {RoleLabelPipe} from '../../../../shared/pipes/role-label.pipe';
import {
  NOTIFICATION_CHANNEL_OPTIONS,
  NotificationChannel,
  requiresNotificationChannel,
} from '../../../../core/utils/implementation';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

export type CreateUserMode = 'create' | 'edit';

export interface CreateUserData {
  mode?: CreateUserMode;
  user?: UserResponse;
}

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, NgSelectModule, InputLabelComponent],
  templateUrl: './create-user.component.html',
})
export class CreateUserComponent implements OnInit, OnDestroy {

  isAdmin = false;

  form = new FormGroup({
    name:                  new FormControl<string | null>('', [Validators.required, Validators.maxLength(100)]),
    lastname:              new FormControl<string | null>('', [Validators.required, Validators.maxLength(100)]),
    email:                 new FormControl<string | null>('', [Validators.required, Validators.email]),
    phone:                 new FormControl<string | null>('', [Validators.maxLength(30)]),
    number_document:       new FormControl<string | null>('', [Validators.maxLength(30)]),
    role_ids:              new FormControl<string[] | null>(null),
    tenant_id:             new FormControl<string | null>(null),
  });

  isLoading = false;
  isLoadingRoles = false;
  isLoadingTenants = false;
  showNotificationChannel = false;

  roles: Select[] = [];
  tenants: Select[] = [];

  notificationChannels = NOTIFICATION_CHANNEL_OPTIONS;

  private destroy$ = new Subject<void>();
  private implementationByTenant = new Map<string, string>();

  // Mismo patrón que en create/edit tenant: el control se construye una vez
  // y se enchufa/desenchufa del FormGroup cuando aplique. Conservar el valor
  // si el usuario alterna varias veces el tenant durante la sesión del modal.
  private notificationChannelCtrl = new FormControl<NotificationChannel | null>(
    null,
    [Validators.required],
  );

  /**
   * Snapshot del valor inicial en modo edit. Sirve para el diff al enviar: el
   * PUT solo incluye los campos que realmente cambiaron y para selectores
   * multi (roles) comparamos sets ignorando orden.
   */
  private initialValue: {
    name?: string;
    lastname?: string;
    phone?: string;
    number_document?: string;
    notification_channel?: NotificationChannel | null;
    role_ids?: string[];
  } = {};

  constructor(
    private _dialogRef: MatDialogRef<CreateUserComponent>,
    private _userService: UserService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    private _roleService: RoleService,
    private _tenantService: TenantsService,
    @Inject(MAT_DIALOG_DATA) public data: CreateUserData,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this._auth.isAdmin();

    if (this.isEdit) {
      this.initEdit();
      return;
    }

    // ─── MODO CREATE ──────────────────────────────────────────────
    if (this.isAdmin) {
      this.form.controls.role_ids.setValidators([Validators.required]);
      this.form.controls.tenant_id.setValidators([Validators.required]);
      this.form.controls.role_ids.updateValueAndValidity();
      this.form.controls.tenant_id.updateValueAndValidity();
      this.loadRoles();
      this.loadTenants();
      // Para ADMIN: la regla del notification_channel se evalúa cuando cambia
      // el tenant seleccionado.
      this.form.controls.tenant_id.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(tid => this.onTenantChange(tid));
    } else {
      // Para TENANT_OWNER/USER: el implementation_type viene del propio tenant
      // del usuario logueado y no cambia durante la sesión del modal. Decidimos
      // visibilidad una sola vez al iniciar.
      const implType = this._auth.getImplementationType();
      this.syncNotificationChannelControl(implType);
    }
  }

  /**
   * Precarga el formulario con los datos del user objetivo, deshabilita los
   * campos que no son editables (email y tenant) y dispara la carga de roles
   * (solo ADMIN).
   */
  private initEdit(): void {
    const user = this.data?.user;
    if (!user) return;

    this.form.patchValue({
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone ?? '',
      number_document: user.number_document ?? '',
    });
    this.form.controls.email.disable({ emitEvent: false });

    const tenantId = user.tenant_id;

    if (this.isAdmin) {
      // El tenant de un user no se cambia desde este flujo.
      if (tenantId) {
        this.tenants = [{ value: tenantId, label: user.tenant_name ?? tenantId }];
        this.form.controls.tenant_id.setValue(tenantId, { emitEvent: false });
      }
      this.form.controls.tenant_id.disable({ emitEvent: false });

      // Roles son editables solo para ADMIN.
      const currentRoleIds = user.role_ids ?? [];
      this.form.controls.role_ids.setValue(currentRoleIds.length ? currentRoleIds : null);
      this.form.controls.role_ids.setValidators([Validators.required]);
      this.form.controls.role_ids.updateValueAndValidity({ emitEvent: false });
      this.loadRoles();
    }

    // Visibilidad de notification_channel: depende del implementation_type
    // del tenant del user.
    const implType = this.resolveImplTypeForUser(user);
    this.syncNotificationChannelControl(implType);
    if (this.showNotificationChannel && user.notification_channel) {
      this.notificationChannelCtrl.setValue(
        user.notification_channel as NotificationChannel,
        { emitEvent: false },
      );
    }

    // Snapshot para diff.
    this.initialValue = {
      name: user.name,
      lastname: user.lastname,
      phone: user.phone ?? '',
      number_document: user.number_document ?? '',
      notification_channel: (user.notification_channel ?? null) as NotificationChannel | null,
      role_ids: [...(user.role_ids ?? [])],
    };
  }

  private resolveImplTypeForUser(user: UserResponse): string | null {
    // ADMIN: como en edit no cargamos la lista completa de tenants, no tenemos
    // el map populado. Si el user trae notification_channel inferimos que el
    // tenant es WIDGET/BOTH (backend sólo asigna canal en ese caso). Fallback
    // conservador: no mostrar selector si no sabemos.
    if (!this.isAdmin) return this._auth.getImplementationType();
    if (user.notification_channel) return 'WIDGET';
    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRoles(): void {
    this.isLoadingRoles = true;
    this._roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles
          .filter(r => r.name !== 'ADMIN')
          .map((r): Select => ({label: RoleLabelPipe.label(r.name), value: r.role_id}));
        this.isLoadingRoles = false;
      },
      error: () => { this.isLoadingRoles = false; },
    });
  }

  private loadTenants(): void {
    this.isLoadingTenants = true;
    this._tenantService.getTenants(new HttpParams().set('size', '1000')).subscribe({
      next: (page) => {
        this.tenants = page.content.map((t): Select => ({label: t.name, value: t.tenant_id}));
        page.content.forEach(t => this.implementationByTenant.set(t.tenant_id, t.implementation_type));
        this.isLoadingTenants = false;
      },
      error: () => { this.isLoadingTenants = false; },
    });
  }

  private onTenantChange(tenantId: string | null): void {
    const implType = tenantId ? (this.implementationByTenant.get(tenantId) ?? null) : null;
    this.syncNotificationChannelControl(implType);
  }

  // Misma idea que en create/edit-tenant: el control se agrega/quita por
  // completo según la regla de negocio para evitar que (a) el form quede
  // inválido por un required que no aplica, y (b) que el payload incluya
  // un campo que el backend no debería ver.
  private syncNotificationChannelControl(implType: string | null): void {
    // Cast a FormGroup no tipado: el typed FormGroup no acepta claves
    // dinámicas en addControl/removeControl/contains.
    const f = this.form as unknown as FormGroup;
    const required = requiresNotificationChannel(implType);
    if (required && !f.contains('notification_channel')) {
      f.addControl('notification_channel', this.notificationChannelCtrl);
      this.showNotificationChannel = true;
    } else if (!required && f.contains('notification_channel')) {
      f.removeControl('notification_channel');
      this.notificationChannelCtrl.reset(null, { emitEvent: false });
      this.showNotificationChannel = false;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isEdit) {
      this.submitUpdate();
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
    const v = this.form.getRawValue() as any;

    const payload: CreateUserRequest = {
      email: v.email!,
      name: v.name!,
      lastname: v.lastname!,
    };
    if (v.phone) payload.phone = v.phone;
    if (v.number_document) payload.number_document = v.number_document;
    // Sólo se envía si el control está activo (caso WIDGET/BOTH). El validador
    // required garantiza que haya valor cuando llegamos hasta aquí.
    if (this.showNotificationChannel && v.notification_channel) {
      payload.notification_channel = v.notification_channel;
    }
    if (this.isAdmin) {
      payload.role_ids = v.role_ids ?? [];
      payload.tenant_id = v.tenant_id!;
    }

    this.isLoading = true;
    this._loader.show();
    this._userService.createUser(payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Usuario creado exitosamente');
        this._dialogRef.close(true);
      },
      error: () => {
        this._loader.hide();
        this.isLoading = false;
      },
    });
  }

  private submitUpdate(): void {
    const userId = this.data?.user?.user_id;
    if (!userId) return;
    const v = this.form.getRawValue() as any;

    const payload: UpdateUserRequest = {};

    if (v.name !== this.initialValue.name) payload.name = v.name;
    if (v.lastname !== this.initialValue.lastname) payload.lastname = v.lastname;
    if ((v.phone ?? '') !== (this.initialValue.phone ?? '')) {
      payload.phone = v.phone ?? '';
    }
    if ((v.number_document ?? '') !== (this.initialValue.number_document ?? '')) {
      payload.number_document = v.number_document ?? '';
    }
    if (this.showNotificationChannel
        && v.notification_channel
        && v.notification_channel !== this.initialValue.notification_channel) {
      payload.notification_channel = v.notification_channel;
    }
    if (this.isAdmin) {
      const rolesChanged = !sameIdSet(v.role_ids ?? [], this.initialValue.role_ids ?? []);
      if (rolesChanged) payload.role_ids = v.role_ids ?? [];
    }

    if (Object.keys(payload).length === 0) {
      this._toastr.info('No hay cambios para guardar');
      this._dialogRef.close(false);
      return;
    }

    this.isLoading = true;
    this._loader.show();
    this._userService.updateUser(userId, payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Usuario actualizado correctamente');
        this._dialogRef.close(true);
      },
      error: () => {
        this._loader.hide();
        this.isLoading = false;
      },
    });
  }

  close(): void {
    this._dialogRef.close(false);
  }

  ctrl(name: string) {
    return this.form.get(name)!;
  }

  get mode(): CreateUserMode {
    return this.data?.mode ?? 'create';
  }

  get isEdit(): boolean {
    return this.mode === 'edit';
  }

  get modalTitle(): string {
    return this.isEdit ? 'Editar Usuario' : 'Nuevo Usuario';
  }

  get submitLabel(): string {
    if (this.isLoading) return this.isEdit ? 'Guardando...' : 'Creando...';
    return this.isEdit ? 'Guardar cambios' : 'Crear Usuario';
  }
}

/**
 * Compara dos arrays de ids ignorando orden. Útil para decidir si un
 * multi-select realmente cambió antes de incluirlo en el payload del PUT.
 */
function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}
