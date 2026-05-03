import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';
import {ToastrService} from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';
import {Subject, takeUntil} from 'rxjs';

import {BotService} from '../../services/bot.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {AuthService} from '../../../../core/services/auth.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {RegisterBotDto, ResponseBotDto, UpdateBotDto} from '../../interfaces/bot.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {tenantUsesLeadAssignees} from '../../../../core/utils/implementation';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

export type CreateBotMode = 'create' | 'edit';

export interface CreateBotData {
  mode?: CreateBotMode;
  bot?: ResponseBotDto;
}

@Component({
  selector: 'app-create-bot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, NgSelectModule, InputLabelComponent],
  templateUrl: './create-bot.component.html',
})
export class CreateBotComponent implements OnInit, OnDestroy {

  form = new FormGroup({
    bot_name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    tenant_id: new FormControl<string | null>(null),
    bot_description: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]),
    lead_assignee_user_ids: new FormControl<string[] | null>(null),
  });

  tenants: Select[] = [];
  assignees: Select[] = [];
  isLoading = false;
  isLoadingAssignees = false;

  // Se activa cuando el tenant target es WIDGET/BOTH (regla de negocio). En
  // WHATSAPP el backend ignora el campo y los leads no pasan por round-robin,
  // así que no tiene sentido pedir responsables.
  showAssigneesSelector = false;

  private destroy$ = new Subject<void>();
  private implementationByTenant = new Map<string, string>();

  // Snapshot para el diff del submit en modo edit.
  private initialAssigneeIds: string[] = [];

  constructor(
    private _dialogRef: MatDialogRef<CreateBotComponent>,
    private _botService: BotService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    private _tenantService: TenantsService,
    @Inject(MAT_DIALOG_DATA) public data: CreateBotData,
  ) {}

  ngOnInit(): void {
    if (this.isEdit && this.data?.bot) {
      this.initEdit();
      return;
    }

    // Modo creación: admin elige tenant, non-admin usa el propio.
    if (this.isAdmin) {
      this.form.get('tenant_id')!.setValidators([Validators.required]);
      this.form.get('tenant_id')!.updateValueAndValidity();
      this.getTenants();
      // El implementation_type lo inferimos del tenant seleccionado.
      this.form.controls.tenant_id.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(tid => this.onTenantChange(tid));
    } else {
      // Non-admin: tenant del usuario logueado, implType resuelto 1 vez.
      const implType = this._auth.getImplementationType();
      this.syncAssigneesVisibility(implType);
      if (this.showAssigneesSelector) {
        this.loadAssigneesForCurrentTenant();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Precarga el form con los datos del bot objetivo, deshabilita el selector
   * de tenant (inmutable) y enchufa el selector de responsables si el tenant
   * owner lo requiere. El snapshot `initialAssigneeIds` alimenta el diff del
   * submit.
   */
  private initEdit(): void {
    const bot = this.data!.bot!;
    this.form.patchValue({
      bot_name: bot.name,
      bot_description: bot.description,
    });

    if (this.isAdmin && bot.tenant_id) {
      this.tenants = [{
        value: bot.tenant_id,
        label: bot.tenant_name ?? bot.tenant_id,
      }];
      this.form.get('tenant_id')!.setValue(bot.tenant_id, { emitEvent: false });
    }
    this.form.get('tenant_id')!.disable({ emitEvent: false });

    const implType = bot.implementation_type ?? this._auth.getImplementationType();
    this.syncAssigneesVisibility(implType);

    if (this.showAssigneesSelector) {
      const currentIds = (bot.lead_assignees ?? []).map(a => a.user_id);
      // Precarga optimista: items desde el bot para que el multi-select muestre
      // los nombres correctos antes de cargar la lista completa del tenant.
      this.assignees = (bot.lead_assignees ?? [])
        .map(a => ({ label: a.full_name, value: a.user_id }));
      this.form.controls.lead_assignee_user_ids.setValue(
        currentIds.length ? currentIds : null,
        { emitEvent: false },
      );
      this.initialAssigneeIds = [...currentIds];

      const tenantId = bot.tenant_id ?? null;
      if (tenantId) {
        this.loadAssigneesByTenant(tenantId, currentIds);
      } else {
        this.loadAssigneesForCurrentTenant();
      }
    }
  }

  private onTenantChange(tenantId: string | null): void {
    this.assignees = [];
    this.form.controls.lead_assignee_user_ids.setValue(null);
    const implType = tenantId ? (this.implementationByTenant.get(tenantId) ?? null) : null;
    this.syncAssigneesVisibility(implType);
    if (tenantId && this.showAssigneesSelector) {
      this.loadAssigneesByTenant(tenantId);
    }
  }

  /**
   * Agrega/quita el validador required + la visibilidad del selector según
   * el implementation_type del tenant. Mismo patrón que `syncNotificationChannelControl`
   * en create-user: el control siempre existe en el FormGroup pero los
   * validadores se activan condicionalmente.
   */
  private syncAssigneesVisibility(implType: string | null | undefined): void {
    const required = tenantUsesLeadAssignees(implType);
    const ctrl = this.form.controls.lead_assignee_user_ids;
    if (required) {
      ctrl.setValidators([Validators.required, nonEmptyArrayValidator]);
      this.showAssigneesSelector = true;
    } else {
      ctrl.clearValidators();
      ctrl.setValue(null, { emitEvent: false });
      this.showAssigneesSelector = false;
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  private loadAssigneesForCurrentTenant(): void {
    const myTenantId = this._auth.getTenantId();
    if (!myTenantId) return;
    this.loadAssigneesByTenant(myTenantId);
  }

  private loadAssigneesByTenant(tenantId: string, preserveSelection?: string[]): void {
    this.isLoadingAssignees = true;
    this._tenantService.getTenantUsers(tenantId).subscribe({
      next: (users) => {
        this.assignees = users.map(u => ({ label: u.full_name, value: u.user_id }));
        if (preserveSelection?.length) {
          this.form.controls.lead_assignee_user_ids.setValue(preserveSelection, { emitEvent: false });
        }
        this.isLoadingAssignees = false;
      },
      error: () => { this.isLoadingAssignees = false; },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this._loader.show();

    if (this.isEdit) {
      this.updateBot();
    } else {
      this.createBot();
    }
  }

  private createBot(): void {
    const v = this.form.getRawValue() as any;
    const payload: RegisterBotDto = {
      bot_name: v.bot_name!,
      bot_description: v.bot_description!,
      tenant_id: this.isAdmin ? v.tenant_id! : this._auth.getTenantId(),
    };
    // Solo se envía si el selector está visible (regla WIDGET/BOTH). En
    // WHATSAPP el backend lo ignora aunque lo enviemos, pero no tiene
    // sentido mandar ruido.
    if (this.showAssigneesSelector && v.lead_assignee_user_ids?.length) {
      payload.lead_assignee_user_ids = v.lead_assignee_user_ids;
    }

    this._botService.createBot(payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Asistente creado exitosamente');
        this._dialogRef.close(true);
      },
      error: () => {
        this._loader.hide();
        this.isLoading = false;
      },
    });
  }

  private updateBot(): void {
    const botId = this.data?.bot?.bot_id;
    if (!botId) {
      this._loader.hide();
      this.isLoading = false;
      return;
    }

    const initialName = this.data!.bot!.name;
    const initialDescription = this.data!.bot!.description;
    const v = this.form.getRawValue() as any;

    const payload: UpdateBotDto = {};
    if (v.bot_name !== initialName) {
      payload.bot_name = v.bot_name!;
    }
    if (v.bot_description !== initialDescription) {
      payload.bot_description = v.bot_description!;
    }
    if (this.showAssigneesSelector) {
      const newIds: string[] = v.lead_assignee_user_ids ?? [];
      if (!sameIdSet(newIds, this.initialAssigneeIds)) {
        payload.lead_assignee_user_ids = newIds;
      }
    }

    if (Object.keys(payload).length === 0) {
      this._loader.hide();
      this.isLoading = false;
      this._toastr.info('No hay cambios para guardar');
      this._dialogRef.close(false);
      return;
    }

    this._botService.updateBot(botId, payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Asistente actualizado correctamente');
        this._dialogRef.close(true);
      },
      error: () => {
        this._loader.hide();
        this.isLoading = false;
      },
    });
  }

  get isAdmin(): boolean {
    const user = this._auth.getUser();
    return user?.roles?.includes('ADMIN') ?? false;
  }

  get mode(): CreateBotMode {
    return this.data?.mode ?? 'create';
  }

  get isEdit(): boolean {
    return this.mode === 'edit';
  }

  get modalTitle(): string {
    return this.isEdit ? 'Editar asistente' : 'Nuevo asistente';
  }

  get submitLabel(): string {
    if (this.isLoading) return this.isEdit ? 'Guardando...' : 'Creando...';
    return this.isEdit ? 'Guardar cambios' : 'Crear asistente';
  }

  getTenants(): void {
    this._tenantService.getTenants(new HttpParams().set('size', '1000')).subscribe({
      next: (page) => {
        this.tenants = page.content.map(t => ({label: t.name, value: t.tenant_id}));
        page.content.forEach(t => this.implementationByTenant.set(t.tenant_id, t.implementation_type));
      },
    });
  }

  close(): void {
    this._dialogRef.close(false);
  }

  get nameCtrl() { return this.form.get('bot_name')!; }
  get descCtrl() { return this.form.get('bot_description')!; }
  get assigneesCtrl() { return this.form.get('lead_assignee_user_ids')!; }
}

/**
 * Validator que fuerza que un FormControl tipo `string[] | null` tenga al
 * menos 1 elemento. Required a secas no alcanza para arrays: un array vacío
 * pasa como "truthy" en Reactive Forms.
 */
function nonEmptyArrayValidator(control: { value: unknown }) {
  const v = control.value;
  if (!Array.isArray(v) || v.length === 0) {
    return { required: true };
  }
  return null;
}

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}
