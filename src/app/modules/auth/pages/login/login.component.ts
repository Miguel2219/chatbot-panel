import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ToastrService} from 'ngx-toastr';

import {AuthService} from '../../../../core/services/auth.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {ChangePasswordComponent} from '../../modals/change-password/change-password.component';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, InputLabelComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

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
    private _dialog: MatDialog,
    private _toastr: ToastrService,
    private _route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Muestra feedback al llegar desde logout automático. 'manual' es
    // el cierre voluntario del user y no necesita toast.
    const reason = this._route.snapshot.queryParamMap.get('reason');
    switch (reason) {
      case 'inactivity':
        this._toastr.info('Tu sesión se cerró por inactividad.', 'Sesión');
        break;
      case 'expired':
        this._toastr.warning('Tu sesión expiró. Vuelve a iniciar.', 'Sesión');
        break;
      case 'password_reset':
        this._toastr.success(
          'Tu contraseña fue actualizada. Inicia sesión con la nueva contraseña.',
          'Listo'
        );
        break;
      case 'other_tab':
        // Cerraron sesión desde otro tab / dispositivo (o desde el botón
        // "Cerrar sesión en todos los dispositivos"). Este tab replicó
        // el logout vía el listener de `storage` en AuthService.
        this._toastr.info(
          'Tu sesión se cerró desde otra ventana o dispositivo.',
          'Sesión'
        );
        break;
    }
  }

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
        if (response.user?.must_change_password) {
          this._auth.saveSession(response);
          const ref = this._dialog.open(ChangePasswordComponent, {
            width: '440px',
            disableClose: false,
            data: { currentPassword: credentials.password },
          });
          ref.afterClosed().subscribe((result) => {
            if (result === true) {
              this._auth.navigateAfterLogin();
            } else {
              this._auth.logout();
              this._toastr.warning('Debes cambiar tu contraseña para acceder.');
              this.isLoading = false;
            }
          });
        } else {
          this._auth.loginSuccess(response);
        }
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
