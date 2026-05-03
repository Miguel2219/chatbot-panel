import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';

import {LeadService} from '../../services/lead.service';
import {LoadingService} from '../../../../core/services/loading.service';
import {LeadResponseDto, LeadStatus} from '../../interfaces/lead.interface';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-update-lead-status',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NgSelectModule],
  templateUrl: './update-lead-status.component.html',
})
export class UpdateLeadStatusComponent {

  selectedStatus: LeadStatus;
  isLoading = false;

  statusOptions: { value: LeadStatus; label: string }[] = [
    { value: 'PENDING',    label: 'Pendiente' },
    { value: 'CONTACTED',  label: 'Contactado' },
    { value: 'CLOSED',     label: 'Cerrado' },
  ];

  constructor(
    private _dialogRef: MatDialogRef<UpdateLeadStatusComponent>,
    private _leadService: LeadService,
    private _loader: LoadingService,
    private _toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: { lead: LeadResponseDto },
  ) {
    this.selectedStatus = data.lead.status as LeadStatus;
  }

  submit(): void {
    this.isLoading = true;
    this._loader.show();
    this._leadService.updateLeadStatus(this.data.lead.id, this.selectedStatus).subscribe({
      next: () => {
        this._loader.hide();
        this._toastr.success('Estado actualizado correctamente');
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
}
