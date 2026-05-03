import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpParams} from '@angular/common/http';
import {MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';
import {ToastrService} from 'ngx-toastr';
import {Subject, takeUntil} from 'rxjs';

import {DocumentService} from '../../services/document.service';
import {BotService} from '../../../bots/services/bot.service';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';
import {Select} from '../../../../core/interfaces/select.interface';

@Component({
  selector: 'app-upload-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    NgSelectModule,
    InputLabelComponent,
  ],
  templateUrl: './upload-document.component.html',
})
export class UploadDocumentComponent implements OnInit, OnDestroy {

  form = new FormGroup({
    tenant_id: new FormControl<string | null>(null),
    bot_id: new FormControl<string | null>(null, [Validators.required]),
  });

  selectedFiles: File[] = [];
  isLoading = false;

  isAdmin = false;
  tenants: Select[] = [];
  bots: Select[] = [];
  isLoadingBots = false;

  /** Nombre del tenant propio (solo non-admin) — se muestra readonly. */
  userTenantName = '';

  private destroy$ = new Subject<void>();

  constructor(
    private _dialogRef: MatDialogRef<UploadDocumentComponent>,
    private _documentService: DocumentService,
    private _botService: BotService,
    private _tenantsService: TenantsService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this._auth.isAdmin();

    if (this.isAdmin) {
      // Admin elige tenant → al cambiar, recargamos la lista de bots.
      this.form.get('tenant_id')!.setValidators([Validators.required]);
      this.form.get('tenant_id')!.updateValueAndValidity();
      this.loadTenants();
      this.form.controls.tenant_id.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(tid => this.onTenantChange(tid));
    } else {
      // Non-admin: tenant del user, se setea una vez y no cambia.
      const user = this._auth.getUser();
      this.userTenantName = user?.tenant_name ?? 'Tu empresa';
      this.form.get('tenant_id')!.setValue(this._auth.getTenantId(), { emitEvent: false });
      this.loadBotsForOwnTenant();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTenants(): void {
    this._tenantsService.getTenants(new HttpParams().set('size', '1000')).subscribe({
      next: (page) => {
        this.tenants = page.content.map(t => ({ label: t.name, value: t.tenant_id }));
      },
    });
  }

  private onTenantChange(tenantId: string | null): void {
    // Reset del bot al cambiar de tenant — los bots del tenant anterior no son
    // válidos para el nuevo. El user tiene que re-elegir.
    this.form.controls.bot_id.setValue(null, { emitEvent: false });
    this.bots = [];
    if (!tenantId) return;
    this.loadBotsByTenant(tenantId);
  }

  private loadBotsByTenant(tenantId: string): void {
    this.isLoadingBots = true;
    this._botService.getBotsByTenantId(tenantId).subscribe({
      next: (bots) => { this.bots = bots; this.isLoadingBots = false; },
      error: () => { this.isLoadingBots = false; },
    });
  }

  private loadBotsForOwnTenant(): void {
    this.isLoadingBots = true;
    this._botService.getBotsByTenantSelect().subscribe({
      next: (bots) => { this.bots = bots; this.isLoadingBots = false; },
      error: () => { this.isLoadingBots = false; },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  submit(): void {
    if (this.selectedFiles.length === 0) {
      this._toastr.warning('Selecciona al menos un archivo');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this._toastr.warning('Selecciona el asistente destino antes de subir');
      return;
    }
    const botId = this.form.controls.bot_id.value!;
    this.isLoading = true;
    this._loader.show();

    this._documentService.uploadDocuments(botId, this.selectedFiles).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Documento(s) subidos correctamente');
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

  get tenantCtrl() { return this.form.get('tenant_id')!; }
  get botCtrl() { return this.form.get('bot_id')!; }

  get canSubmit(): boolean {
    return !this.isLoading && this.selectedFiles.length > 0 && this.form.valid;
  }
}
