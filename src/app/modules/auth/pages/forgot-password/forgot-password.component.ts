import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {AuthService} from '../../../../core/services/auth.service';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    InputLabelComponent,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {

  formForgot = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  isLoading = false;
  submitted = false;

  constructor(private _auth: AuthService) {}

  submit(): void {
    if (this.formForgot.invalid) {
      this.formForgot.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const email = this.formForgot.value.email!;

    this._auth.forgotPassword(email).subscribe({
      next: () => {
        // Siempre mostramos la pantalla de "revisa tu correo" — el backend
        // ya cubre el caso "no existe" respondiendo el mismo 200.
        this.submitted = true;
        this.isLoading = false;
      },
      error: () => {
        // Caso raro (red caída). No exponemos el error real; mostramos la
        // misma pantalla de confirmación para no dar pistas.
        this.submitted = true;
        this.isLoading = false;
      },
    });
  }

  get emailControl() { return this.formForgot.get('email')!; }
}
