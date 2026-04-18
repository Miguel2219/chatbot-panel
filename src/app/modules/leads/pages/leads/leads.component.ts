import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';

import { LeadService } from '../../services/lead.service';
import { BotService } from '../../../bots/services/bot.service';
import { TableComponent } from '../../../../shared/layouts/table/table.component';
import { UpdateLeadStatusComponent } from '../../modals/update-lead-status/update-lead-status.component';
import { LeadResponseDto } from '../../interfaces/lead.interface';
import { TableColumn, TableActions } from '../../../../core/interfaces/table.interface';
import { Select } from '../../../../core/interfaces/select.interface';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TableComponent, NgSelectModule],
  templateUrl: './leads.component.html',
})
export class LeadsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Nombre',   key: 'name',        isSortable: true, dataType: 'text' },
    { name: 'Teléfono', key: 'phone',                         dataType: 'text' },
    { name: 'Email',    key: 'email',                         dataType: 'text' },
    { name: 'Canal',    key: 'channel',                   dataType: 'text' },
    { name: 'Asesor asignado',    key: 'assigned_adviser',                   dataType: 'text' },
    { name: 'Estado',   key: 'status',                        dataType: 'status' },
    { name: 'Fecha',    key: 'created_at',   isSortable: true, dataType: 'date' },
  ];

  actions: TableActions = { add: false, edit: true, delete: false, search: true };

  bots: Select[] = [];
  leads: LeadResponseDto[] = [];
  selectedBotId = '';
  isInitializing = true;
  isLoading = false;

  constructor(
    private _leadService: LeadService,
    private _botService: BotService,
    private _dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this._botService.getBotsByTenantSelect().subscribe({
      next: (bots) => {
        this.bots = bots;
        this.isInitializing = false;
        if (bots.length > 0) {
          this.selectedBotId = bots[0].value;
          this.loadLeads();
        }
      },
      error: () => { this.isInitializing = false; },
    });
  }

  onBotChange(): void {
    if (this.selectedBotId) this.loadLeads();
  }

  loadLeads(): void {
    this.isLoading = true;
    this._leadService.getLeadsByBot(this.selectedBotId).subscribe({
      next: (data) => {
        this.leads = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  openUpdateStatus(lead: LeadResponseDto): void {
    const ref = this._dialog.open(UpdateLeadStatusComponent, {
      width: '400px',
      data: { lead },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadLeads();
    });
  }
}
