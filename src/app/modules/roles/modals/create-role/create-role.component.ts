import {Component, Inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ToastrService} from 'ngx-toastr';

import {RoleService} from '../../services/role.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {RoleResponse} from '../../interfaces/role.interface';
import {InputLabelComponent} from '../../../../shared/components/input-label/input-label.component';
import {RoleLabelPipe} from '../../../../shared/pipes/role-label.pipe';

@Component({
  selector: 'app-create-role',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, InputLabelComponent],
  templateUrl: './create-role.component.html',
})
export class CreateRoleComponent {
  isEdit = false;
  isLoading = false;

  form = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(80),
    ]),
    description: new FormControl('', [Validators.maxLength(200)]),
  });

  constructor(
    private _dialogRef: MatDialogRef<CreateRoleComponent>,
    private _roleService: RoleService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: RoleResponse | null,
  ) {
    if (data?.role_id) {
      this.isEdit = true;
      this.form.patchValue({
        name: RoleLabelPipe.label(data.name),
        description: data.description
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this._loader.show();

    const payload = {
      name: this.form.value.name!,
      description: this.form.value.description ?? '',
    };

    const call$ = this.isEdit
      ? this._roleService.updateRole(this.data!.role_id, payload)
      : this._roleService.createRole(payload);

    call$.subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success(this.isEdit ? 'Rol actualizado correctamente' : 'Rol creado exitosamente');
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

  get nameCtrl() { return this.form.get('name')!; }
  get descCtrl() { return this.form.get('description')!; }
}
