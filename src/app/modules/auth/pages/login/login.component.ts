import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {

  formLogin = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private _auth: AuthService,
    private _loader: LoadingService,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.formLogin.value.email!,
      password: this.formLogin.value.password!,
    };

    this._auth.login(credentials).subscribe({
      next: (response) => {
        this._auth.loginSuccess(response);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      },
    });
  }

  get emailControl() { return this.formLogin.get('email')!; }
  get passwordControl() { return this.formLogin.get('password')!; }
}
