import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface DeleteConfirmData {
  title?: string;
  legend: string;
  message?: string;
}

@Component({
  selector: 'app-delete-confirm',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './delete-confirm.component.html',
})
export class DeleteConfirmComponent {

  constructor(
    private _dialogRef: MatDialogRef<DeleteConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmData,
  ) {}

  confirm(): void {
    this._dialogRef.close(true);
  }

  cancel(): void {
    this._dialogRef.close(false);
  }
}
