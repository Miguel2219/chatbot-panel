import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';
import {ToastrService} from 'ngx-toastr';
import {Subject, takeUntil} from 'rxjs';

import {TenantsService} from '../../services/tenants.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {Select} from '../../../../core/interfaces/select.interface';
import {TenantResponse, TenantUserSelectResponse, UpdateTenantRequest,} from '../../interfaces/tenant.interface';
import {
  ImplementationType,
  NOTIFICATION_CHANNEL_OPTIONS,
  NotificationChannel,
  requiresNotificationChannel,
} from '../../../../core/utils/implementation';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

interface EditTenantData {
  tenant: TenantResponse;
}

@Component({
  selector: 'app-edit-tenant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, NgSelectModule, InputLabelComponent],
  templateUrl: './edit-tenant.component.html',
})
export class EditTenantComponent implements OnInit, OnDestroy {

  implementationTypes: Select[] = [
    {label: 'WhatsApp',          value: ImplementationType.WHATSAPP},
    {label: 'Widget',            value: ImplementationType.WIDGET},
    {label: 'WhatsApp + Widget', value: ImplementationType.BOTH},
  ];

  notificationChannels = NOTIFICATION_CHANNEL_OPTIONS;

  ownerOptions: TenantUserSelectResponse[] = [];
  isLoading = false;
  isLoadingUsers = false;
  showOwnerNotificationChannel = false;

  private destroy$ = new Subject<void>();
  private initialValue: UpdateTenantRequest = {};

  // Control reusable — se enchufa/desenchufa del FormGroup según las reglas
  // de visibilidad. Mantener una sola instancia preserva el valor si el
  // usuario alterna implementation_type u owner varias veces.
  private ownerNotificationChannelCtrl = new FormControl<NotificationChannel | null>(
    null,
    [Validators.required],
  );

  form = new FormGroup({
    tenant_name:         new FormControl<string | null>('', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]),
    tenant_email:        new FormControl<string | null>('', [Validators.required, Validators.email]),
    implementation_type: new FormControl<string | null>(null, [Validators.required]),
    owner_user_id:       new FormControl<string | null>(null, [Validators.required]),
  });

  constructor(
    private _dialogRef: MatDialogRef<EditTenantComponent>,
    private _tenantService: TenantsService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: EditTenantData,
  ) {}

  ngOnInit(): void {
    const t = this.data.tenant;
    this.form.patchValue({
      tenant_name: t.name,
      tenant_email: t.email,
      implementation_type: t.implementation_type,
    });
    this.initialValue = {
      tenant_name: t.name,
      tenant_email: t.email,
      implementation_type: t.implementation_type as ImplementationType,
    };
    this.loadOwners(t.tenant_id);

    // Re-evaluar la visibilidad del campo owner_notification_channel cada vez
    // que cambie el implementation_type O el owner seleccionado: la regla
    // depende de ambas variables (¿el tipo lo exige? ¿el owner ya lo tiene?).
    this.form.controls.implementation_type.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncOwnerNotificationChannelControl());
    this.form.controls.owner_user_id.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncOwnerNotificationChannelControl());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOwners(tenantId: string): void {
    this.isLoadingUsers = true;
    this._tenantService.getTenantUsers(tenantId).subscribe({
      next: (users) => {
        this.ownerOptions = users;
        const current = users.find(u => u.is_current_owner);
        if (current) {
          this.form.controls.owner_user_id.setValue(current.user_id);
          this.initialValue.owner_user_id = current.user_id;
        }
        this.isLoadingUsers = false;
        // El listado puede llegar después del primer ngOnInit, así que reevaluamos
        // la visibilidad del campo una vez que ya tenemos la lista de owners con
        // su notification_channel respectivo.
        this.syncOwnerNotificationChannelControl();
      },
      error: () => { this.isLoadingUsers = false; },
    });
  }

  // Decide si el campo `owner_notification_channel` debe estar presente:
  //
  //   1) Si el implementation_type seleccionado NO exige el campo
  //      (WHATSAPP) → quitar control.
  //   2) Si lo exige (WIDGET/BOTH) Y el owner resultante ya tiene un
  //      notification_channel definido → quitar control (no hace falta
  //      pedirlo de nuevo).
  //   3) Si lo exige Y el owner resultante NO tiene uno → agregar control
  //      con validador required → bloquea el submit hasta que el usuario
  //      elija un valor.
  private syncOwnerNotificationChannelControl(): void {
    const implType = this.form.controls.implementation_type.value;
    const ownerId = this.form.controls.owner_user_id.value;
    const owner = this.ownerOptions.find(u => u.user_id === ownerId);

    const ownerHasChannel = owner?.notification_channel != null && owner.notification_channel !== '';
    const required = requiresNotificationChannel(implType) && !ownerHasChannel;

    // Cast a FormGroup no tipado: el typed FormGroup no acepta claves
    // dinámicas en addControl/removeControl/contains.
    const f = this.form as unknown as FormGroup;
    if (required && !f.contains('owner_notification_channel')) {
      f.addControl('owner_notification_channel', this.ownerNotificationChannelCtrl);
      this.showOwnerNotificationChannel = true;
    } else if (!required && f.contains('owner_notification_channel')) {
      f.removeControl('owner_notification_channel');
      this.ownerNotificationChannelCtrl.reset(null, { emitEvent: false });
      this.showOwnerNotificationChannel = false;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue() as any;

    const payload: UpdateTenantRequest = {};
    if (v.tenant_name !== this.initialValue.tenant_name) payload.tenant_name = v.tenant_name!;
    if (v.tenant_email !== this.initialValue.tenant_email) payload.tenant_email = v.tenant_email!;
    if (v.implementation_type !== this.initialValue.implementation_type) {
      payload.implementation_type = v.implementation_type as ImplementationType;
    }
    if (v.owner_user_id !== this.initialValue.owner_user_id) payload.owner_user_id = v.owner_user_id!;

    // Sólo se envía si el control quedó activo en el form (caso 3 de
    // syncOwnerNotificationChannelControl). El backend lo aplica al owner
    // resultante (entrante si hay swap, actual si no).
    if (this.showOwnerNotificationChannel && v.owner_notification_channel) {
      payload.owner_notification_channel = v.owner_notification_channel;
    }

    if (Object.keys(payload).length === 0) {
      this._dialogRef.close(false);
      return;
    }

    this.isLoading = true;
    this._loader.show();
    this._tenantService.updateTenant(this.data.tenant.tenant_id, payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Tenant actualizado correctamente');
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
}
