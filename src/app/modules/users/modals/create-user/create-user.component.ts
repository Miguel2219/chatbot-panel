import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { UserService } from '../../services/user.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './create-user.component.html',
})
export class CreateUserComponent {

  form = new FormGroup({
    name:           new FormControl('', [Validators.required]),
    lastname:       new FormControl('', [Validators.required]),
    email:          new FormControl('', [Validators.required, Validators.email]),
    password:       new FormControl('', [Validators.required, Validators.minLength(6)]),
    phone:          new FormControl('', [Validators.required]),
    numberDocument: new FormControl('', [Validators.required]),
  });

  isLoading = false;
  showPassword = false;

  constructor(
    private _dialogRef: MatDialogRef<CreateUserComponent>,
    private _userService: UserService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this._loader.show();

    const payload = {
      name:           this.form.value.name!,
      lastname:       this.form.value.lastname!,
      email:          this.form.value.email!,
      password:       this.form.value.password!,
      phone:          this.form.value.phone!,
      numberDocument: this.form.value.numberDocument!,
    };

    this._userService.createAdviser(this._auth.getTenantId(), payload).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Usuario creado exitosamente');
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

  get f() { return this.form.controls; }
}
