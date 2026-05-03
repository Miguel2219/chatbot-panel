import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';
import {ToastrService} from 'ngx-toastr';
import {Subject, takeUntil} from 'rxjs';

import {TenantsService} from '../../services/tenants.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {Select} from '../../../../core/interfaces/select.interface';
import {CreateTenantRequest} from '../../interfaces/tenant.interface';
import {
  ImplementationType,
  NOTIFICATION_CHANNEL_OPTIONS,
  NotificationChannel,
  requiresNotificationChannel,
} from '../../../../core/utils/implementation';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

@Component({
  selector: 'app-create-tenant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, NgSelectModule, InputLabelComponent],
  templateUrl: './create-tenant.component.html',
})
export class CreateTenantComponent implements OnInit, OnDestroy {

  implementationTypes: Select[] = [
    {label: 'WhatsApp',          value: ImplementationType.WHATSAPP},
    {label: 'Widget',            value: ImplementationType.WIDGET},
    {label: 'WhatsApp + Widget', value: ImplementationType.BOTH},
  ];

  notificationChannels = NOTIFICATION_CHANNEL_OPTIONS;

  isLoading = false;
  showNotificationChannel = false;

  private destroy$ = new Subject<void>();

  // El control se construye una vez y se enchufa/desenchufa del FormGroup
  // según el implementation_type seleccionado. Mantenerlo como instancia
  // estable evita perder el valor si el usuario alterna varias veces el
  // tipo de implementación dentro de la misma sesión del modal.
  private notificationChannelCtrl = new FormControl<NotificationChannel | null>(
    null,
    [Validators.required],
  );

  form = new FormGroup({
    tenant_name:                new FormControl<string | null>('', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]),
    tenant_email:               new FormControl<string | null>('', [Validators.required, Validators.email]),
    implementation_type:        new FormControl<string | null>(null, [Validators.required]),

    owner_name:                 new FormControl<string | null>('', [Validators.required, Validators.maxLength(100)]),
    owner_lastname:             new FormControl<string | null>('', [Validators.required, Validators.maxLength(100)]),
    owner_email:                new FormControl<string | null>('', [Validators.required, Validators.email]),
    owner_phone:                new FormControl<string | null>('', [Validators.maxLength(30)]),
    owner_number_document:      new FormControl<string | null>('', [Validators.maxLength(30)]),
  });

  constructor(
    private _dialogRef: MatDialogRef<CreateTenantComponent>,
    private _tenantService: TenantsService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.form.controls.implementation_type.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(implType => this.syncNotificationChannelControl(implType));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Agrega/quita el control completo (no sólo lo oculta) según la regla
  // de negocio centralizada en `requiresNotificationChannel`. Quitar el
  // control evita que `form.invalid` sea true por un required que no
  // aplica, y garantiza que `getRawValue()` no incluya el campo cuando
  // no debe enviarse.
  private syncNotificationChannelControl(implType: string | null): void {
    // Cast a FormGroup no tipado para poder agregar/quitar el control
    // dinámicamente: el FormGroup tipado del form no acepta claves que
    // no estén en su mapa de controles fijo.
    const f = this.form as unknown as FormGroup;
    const required = requiresNotificationChannel(implType);
    if (required && !f.contains('owner_notification_channel')) {
      f.addControl('owner_notification_channel', this.notificationChannelCtrl);
      this.showNotificationChannel = true;
    } else if (!required && f.contains('owner_notification_channel')) {
      f.removeControl('owner_notification_channel');
      this.notificationChannelCtrl.reset(null, { emitEvent: false });
      this.showNotificationChannel = false;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue() as any;

    const payload: CreateTenantRequest = {
      tenant_name: v.tenant_name!,
      tenant_email: v.tenant_email!,
      implementation_type: v.implementation_type as ImplementationType,
      owner_name: v.owner_name!,
      owner_lastname: v.owner_lastname!,
      owner_email: v.owner_email!,
    };
    if (v.owner_phone) payload.owner_phone = v.owner_phone;
    if (v.owner_number_document) payload.owner_number_document = v.owner_number_document;
    // Sólo se envía si el control está activo en el form (es decir,
    // implementation_type es WIDGET o BOTH). El validador required
    // garantiza que no llegue vacío en ese caso.
    if (this.showNotificationChannel && v.owner_notification_channel) {
      payload.owner_notification_channel = v.owner_notification_channel;
    }

    this.isLoading = true;
    this._loader.show();
    this._tenantService.createTenant(payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Tenant creado exitosamente');
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
