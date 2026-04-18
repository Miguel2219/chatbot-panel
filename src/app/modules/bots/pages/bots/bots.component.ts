import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { BotService } from '../../services/bot.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { TableComponent } from '../../../../shared/layouts/table/table.component';
import { DeleteConfirmComponent } from '../../../../shared/layouts/delete-confirm/delete-confirm.component';
import { CreateBotComponent } from '../../modals/create-bot/create-bot.component';
import { ResponseBotDto } from '../../interfaces/bot.interface';
import { TableColumn, TableActions } from '../../../../core/interfaces/table.interface';
import { ToastrService } from 'ngx-toastr';
import {HttpParams} from '@angular/common/http';

@Component({
  selector: 'app-bots',
  standalone: true,
  imports: [CommonModule, MatIconModule, TableComponent],
  templateUrl: './bots.component.html',
})
export class BotsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Nombre',      key: 'name',        isSortable: true, dataType: 'text' },
    { name: 'Descripción', key: 'description',               dataType: 'text' },
    { name: 'Estado',      key: 'is_active',                  dataType: 'boolean' },
    { name: 'Creado',      key: 'created_at',   isSortable: true, dataType: 'date' },
  ];

  actions: TableActions = { add: true, edit: false, delete: true, search: true };

  bots: ResponseBotDto[] = [];
  isLoading = true;
  lastParams: HttpParams = new HttpParams();
  totalElements: number = 0;
  isPageable: boolean = false;
  size: number = 0;
  pageIndex: number = 0

  constructor(
    private _botService: BotService,
    private _auth: AuthService,
    private _loader: LoadingService,
    private _dialog: MatDialog,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.getBots(new HttpParams());
  }

  getBots(params: HttpParams): void {
    this.isLoading = true;
    this.lastParams = params;
    this._botService.getBotsByTenant(params).subscribe({
      next: (data) => {
        this.bots = data.content;
        this.totalElements = data.totalElements;
        this.size = data.size;
        this.pageIndex = data.number;
        this.isPageable = this.totalElements > this.size;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  openCreateBot(): void {
    const ref = this._dialog.open(CreateBotComponent, { width: '520px', autoFocus: false });
    ref.afterClosed().subscribe(result => {
      if (result) this.getBots(new HttpParams());
    });
  }

  deleteBot(bot: ResponseBotDto): void {
    const ref = this._dialog.open(DeleteConfirmComponent, {
      width: '440px',
      data: {
        legend: `¿Deseas eliminar el bot "${bot.name}"?`,
        message: 'Esta acción eliminará también sus conversaciones y documentos asociados.',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this._loader.show();
      this._botService.deleteBot(bot.bot_id).subscribe({
        next: () => {
          this._loader.hide();
          this._toastr.success('Bot eliminado correctamente');
          this.getBots(new HttpParams());
        },
        error: () => this._loader.hide(),
      });
    });
  }
}
