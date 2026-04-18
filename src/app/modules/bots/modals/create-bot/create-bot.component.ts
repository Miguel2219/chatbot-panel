import {Component, Inject, OnInit} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';

import { BotService } from '../../services/bot.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import {RegisterBotDto} from '../../interfaces/bot.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {TenantsService} from '../../../tenants/services/tenants.service';

@Component({
  selector: 'app-create-bot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, NgSelectModule],
  templateUrl: './create-bot.component.html',
})

export class CreateBotComponent implements OnInit {

  form = new FormGroup({
    bot_name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    tenant_id: new FormControl(null, [Validators.required]),
    bot_description: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]),
  });

   tenants: Select[] = []

  isLoading = false;

  constructor(
    private _dialogRef: MatDialogRef<CreateBotComponent>,
    private _botService: BotService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    private _tenantService: TenantsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.getTenants();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this._loader.show();

    const payload: RegisterBotDto = {
      bot_name: this.form.value.bot_name!,
      bot_description: this.form.value.bot_description!,
      tenant_id: this.isAdmin ? this.form.value.tenant_id! : this._auth.getTenantId(),
    };

    console.log(payload)

    this._botService.createBot(payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Bot creado exitosamente');
        this._dialogRef.close(true);
      },
      error: () => {
        this._loader.hide();
        this.isLoading = false;
      },
    });
  }

  get isAdmin(): boolean {
    const user = this._auth.getUser()
    return user?.roles?.includes('ADMIN') ?? false;
  }

  getTenants(): void {
    this._tenantService.getTenantsSelect().subscribe({
      next: (data) => {
        this.tenants = data
        console.log(this.tenants)
      }
    })
  }


  close(): void {
    this._dialogRef.close(false);
  }

  get nameCtrl() { return this.form.get('bot_name')!; }
  get descCtrl() { return this.form.get('bot_description')!; }
}
