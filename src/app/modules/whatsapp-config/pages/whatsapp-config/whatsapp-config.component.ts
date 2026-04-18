import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NgSelectModule } from '@ng-select/ng-select';

import { WhatsappConfigService } from '../../services/whatsapp-config.service';
import { BotService } from '../../../bots/services/bot.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { DeleteConfirmComponent } from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import { WhatsappConfigResponseDto } from '../../interfaces/whatsapp-config.interface';
import { Select } from '../../../../core/interfaces/select.interface';
import { ToastrService } from 'ngx-toastr';
import {AuthService} from '../../../../core/services/auth.service';

@Component({
  selector: 'app-whatsapp-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule, NgSelectModule],
  templateUrl: './whatsapp-config.component.html',
})
export class WhatsappConfigComponent implements OnInit {

  bots: Select[] = [];
  selectedBotId = '';
  config: WhatsappConfigResponseDto | null = null;
  isLoading = false;
  isEditing = false;

  form = new FormGroup({
    phone_number_id: new FormControl('', [Validators.required]),
    api_key:         new FormControl('', [Validators.required]),
  });

  constructor(
    private _whatsappService: WhatsappConfigService,
    private _botService: BotService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this._botService.getBotsByTenantSelect().subscribe({
      next: (bots) => {
        this.bots = bots;
        if (bots.length > 0) {
          this.selectedBotId = bots[0].value;
          this.loadConfig();
        }
      },
    });
  }

  onBotChange(): void {
    this.config = null;
    this.isEditing = false;
    this.form.reset();
    if (this.selectedBotId) this.loadConfig();
  }

  loadConfig(): void {
    this.isLoading = true;
    this._whatsappService.getConfigByBot(this.selectedBotId).subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.isLoading = false;
      },
      error: () => {
        this.config = null;
        this.isLoading = false;
      },
    });
  }

  startEditing(): void {
    this.isEditing = true;
    if (this.config) {
      this.form.patchValue({
        phone_number_id: this.config.phone_number_id,
      });
    }
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this._loader.show();
    const payload = {
      phone_number_id: this.form.value.phone_number_id!,
      api_key: this.form.value.api_key!,
    };

    const request$ = this.config
      ? this._whatsappService.updateConfig(this.config.id, payload)
      : this._whatsappService.createConfig(this.selectedBotId, payload);

    request$.subscribe({
      next: (cfg) => {
        this._loader.hide();
        this.config = cfg;
        this.isEditing = false;
        this.form.reset();
        this._toastr.success(this.config ? 'Configuración actualizada' : 'Configuración guardada');
      },
      error: () => this._loader.hide(),
    });
  }

  deleteConfig(): void {
    if (!this.config) return;
    const ref = this._dialog.open(DeleteConfirmComponent, {
      width: '440px',
      data: {
        legend: '¿Deseas eliminar la configuración de WhatsApp?',
        message: 'El bot dejará de recibir mensajes de WhatsApp.',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this._loader.show();
      this._whatsappService.deleteConfig(this.config!.id).subscribe({
        next: () => {
          this._loader.hide();
          this.config = null;
          this._toastr.success('Configuración eliminada');
        },
        error: () => this._loader.hide(),
      });
    });
  }
}
