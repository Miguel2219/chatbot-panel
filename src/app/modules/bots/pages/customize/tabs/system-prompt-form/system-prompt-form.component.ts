import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';

import {BotService} from '../../../../services/bot.service';
import {LoadingService} from '../../../../../../core/services/loading.service';
import {InputLabelComponent} from '../../../../../../shared/components/input-label/input-label.component';

@Component({
  selector: 'app-system-prompt-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputLabelComponent],
  templateUrl: './system-prompt-form.component.html',
})
export class SystemPromptFormComponent implements OnInit {

  form = new FormGroup({
    system_prompt: new FormControl('', [Validators.maxLength(20000)]),
  });

  isLoadingPrompt = true;
  isSaving = false;
  private initialPrompt = '';
  private botId: string | null = null;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _botService: BotService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.botId = this._route.parent?.snapshot.paramMap.get('bot_id') ?? null;
    if (!this.botId) { this._router.navigate(['/administration/bots']); return; }

    this._botService.getSystemPrompt(this.botId).subscribe({
      next: (res) => {
        const value = res?.system_prompt ?? '';
        this.initialPrompt = value;
        this.form.patchValue({ system_prompt: value });
        this.isLoadingPrompt = false;
      },
      error: () => { this.isLoadingPrompt = false; },
    });
  }

  submit(): void {
    if (this.form.invalid || !this.botId) {
      this.form.markAllAsTouched();
      return;
    }

    const next = this.form.value.system_prompt ?? '';
    if (next === this.initialPrompt) {
      this._toastr.info('No hay cambios para guardar');
      return;
    }

    this.isSaving = true;
    this._loader.show();
    this._botService.updateSystemPrompt(this.botId, { system_prompt: next }).subscribe({
      next: () => {
        this._loader.hide();
        this.initialPrompt = next;
        this.isSaving = false;
        this._toastr.success('Personalización guardada');
      },
      error: () => {
        this._loader.hide();
        this.isSaving = false;
      },
    });
  }

  cancel(): void {
    this._router.navigate(['/administration/bots']);
  }

  get promptCtrl() { return this.form.get('system_prompt')!; }

  get counterState(): 'normal' | 'warning' | 'danger' {
    const len = this.promptCtrl.value?.length ?? 0;
    if (len >= 20000) return 'danger';
    if (len >= 18000) return 'warning';
    return 'normal';
  }
}
