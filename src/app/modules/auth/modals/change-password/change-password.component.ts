import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ToastrService} from 'ngx-toastr';

import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {ChangePasswordRequest} from '../../interfaces/auth.interface';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

interface ChangePasswordData {
  currentPassword: string;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, InputLabelComponent],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {

  form = new FormGroup({
    new_password:     new FormControl<string | null>('', [Validators.required, Validators.minLength(8)]),
    confirm_password: new FormControl<string | null>('', [Validators.required]),
  }, { validators: matchPasswords('new_password', 'confirm_password') });

  showNew = false;
  showConfirm = false;
  isLoading = false;

  constructor(
    private _dialogRef: MatDialogRef<ChangePasswordComponent>,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: ChangePasswordData,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: ChangePasswordRequest = {
      current_password: this.data.currentPassword,
      new_password: this.form.value.new_password!,
    };
    this.isLoading = true;
    this._loader.show();
    this._auth.changePassword(payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Contraseña actualizada correctamente');
        this._dialogRef.close(true);
      },
      error: () => {
        this._loader.hide();
        this.isLoading = false;
      },
    });
  }

  cancel(): void { this._dialogRef.close(false); }

  get newCtrl()     { return this.form.get('new_password')!; }
  get confirmCtrl() { return this.form.get('confirm_password')!; }

  get mismatchError(): boolean {
    return !!this.form.errors?.['mismatch'] && this.confirmCtrl.touched;
  }
}

function matchPasswords(a: string, b: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const av = control.get(a)?.value;
    const bv = control.get(b)?.value;
    if (!av || !bv) return null;
    return av === bv ? null : { mismatch: true };
  };
}
