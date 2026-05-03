import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ToastrService} from 'ngx-toastr';

import {AuthService} from '../../../../core/services/auth.service';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

type ResetState = 'validating' | 'valid' | 'invalid' | 'success';
type StrengthLevel = 'weak' | 'medium' | 'strong';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    InputLabelComponent,
  ],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit, OnDestroy {

  state: ResetState = 'validating';
  emailMasked = '';
  isSubmitting = false;
  showNewPassword = false;
  showConfirmPassword = false;
  successCountdown = 3;

  // Regex espejo del backend: mínimo 8 chars, al menos 1 letra y 1 número.
  private static readonly PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  formReset = new FormGroup({
    new_password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(ResetPasswordComponent.PASSWORD_PATTERN),
    ]),
    confirm_password: new FormControl('', [Validators.required]),
  }, { validators: this.matchPasswordsValidator });

  private token = '';
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private _auth: AuthService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const token = this._route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'invalid';
      return;
    }
    this.token = token;
    this._auth.validateResetToken(token).subscribe({
      next: (res) => {
        this.emailMasked = res.email_masked;
        this.state = 'valid';
      },
      error: () => {
        // Cualquier error (400 / 500 / red) colapsa en "link inválido". El
        // backend no distingue expirado/usado/inexistente por diseño.
        this.state = 'invalid';
      },
    });
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  submit(): void {
    if (this.formReset.invalid) {
      this.formReset.markAllAsTouched();
      return;
    }
    const newPassword = this.formReset.value.new_password!;
    this.isSubmitting = true;

    this._auth.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.state = 'success';
        this.startSuccessCountdown();
      },
      error: (err) => {
        this.isSubmitting = false;
        const code = err?.error?.code;
        if (code === 'INVALID_RESET_TOKEN') {
          // Se caducó o se usó entre validate y submit — mandamos al user
          // de vuelta a "link inválido" en lugar de ocultar el problema.
          this.state = 'invalid';
          return;
        }
        const message = err?.error?.message ?? 'No pudimos actualizar tu contraseña. Intenta de nuevo.';
        this._toastr.error(message);
      },
    });
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ─── Validators & helpers ─────────────────────────────────────────────

  private matchPasswordsValidator(group: AbstractControl): ValidationErrors | null {
    const a = group.get('new_password')?.value;
    const b = group.get('confirm_password')?.value;
    if (!a || !b) return null;
    return a === b ? null : { passwordMismatch: true };
  }

  get newPasswordControl() { return this.formReset.get('new_password')!; }
  get confirmPasswordControl() { return this.formReset.get('confirm_password')!; }

  /** Indicador visual de fuerza. Cuenta checks simples — no pretende ser zxcvbn. */
  get strength(): StrengthLevel {
    const v = this.newPasswordControl.value ?? '';
    if (!v) return 'weak';
    let score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Za-z]/.test(v) && /\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (score >= 4) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  }

  /** True para que el error "no coinciden" viva en el label de confirmación. */
  get showMismatchError(): boolean {
    const confirm = this.confirmPasswordControl;
    return !!this.formReset.errors?.['passwordMismatch']
        && confirm.touched
        && confirm.value !== '';
  }

  private startSuccessCountdown(): void {
    this.successCountdown = 3;
    this.countdownTimer = setInterval(() => {
      this.successCountdown--;
      if (this.successCountdown <= 0) {
        this.clearCountdown();
        this._router.navigate(['/auth'], { queryParams: { reason: 'password_reset' } });
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
}
