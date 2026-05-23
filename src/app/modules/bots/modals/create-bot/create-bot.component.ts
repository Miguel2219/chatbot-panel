import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';
import {ToastrService} from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';

import {BotService} from '../../services/bot.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {AuthService} from '../../../../core/services/auth.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {RegisterBotDto, ResponseBotDto, UpdateBotDto} from '../../interfaces/bot.interface';
import {Select} from '../../../../core/interfaces/select.interface';
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
export class CreateBotComponent implements OnInit {

  form = new FormGroup({
    bot_name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    tenant_id: new FormControl<string | null>(null),
    bot_description: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]),
  });

  tenants: Select[] = [];
  isLoading = false;

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
    }
  }

  /**
   * Precarga el form con los datos del bot objetivo y deshabilita el selector
   * de tenant (inmutable).
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
      },
    });
  }

  close(): void {
    this._dialogRef.close(false);
  }

  get nameCtrl() { return this.form.get('bot_name')!; }
  get descCtrl() { return this.form.get('bot_description')!; }
}
