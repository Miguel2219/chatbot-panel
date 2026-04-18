import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';

import {ConversationService} from '../../services/conversation.service';
import {BotService} from '../../../bots/services/bot.service';
import {AuthService} from '../../../../core/services/auth.service';
import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {ConversationResponseDto} from '../../interfaces/conversation.interface';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {Select} from '../../../../core/interfaces/select.interface';
import {HttpParams} from '@angular/common/http';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TableComponent, NgSelectModule],
  templateUrl: './conversations.component.html',
})
export class ConversationsComponent implements OnInit {

  tableColumns: TableColumn[] = [
    { name: 'Sesión',    key: 'session_id',  isSortable: true, dataType: 'text' },
    { name: 'Rol',       key: 'role',                         dataType: 'badge' },
    { name: 'Mensaje',   key: 'message',                      dataType: 'text' },
    { name: 'Fecha',     key: 'created_at',  isSortable: true, dataType: 'date' },
  ];

  actions: TableActions = { add: false, edit: false, delete: false, search: true };

  bots: Select[] = [];
  conversations: ConversationResponseDto[] = [];
  selectedBotId = '';
  isInitializing = true;
  isLoading = false;
  totalElements: number = 0;
  size: number = 0;
  isPageable: boolean = false;
  pageIndex: number = 0

  constructor(
    private _conversationService: ConversationService,
    private _botService: BotService,
    private _auth: AuthService,
  ) {}

  ngOnInit(): void {
    this._botService.getBotsByTenantSelect().subscribe({
      next: (bots) => {
        this.bots = bots;
        this.isInitializing = false;
        if (bots.length > 0) {
          this.selectedBotId = bots[0].value;
          this.loadConversations(new HttpParams());
        }
      },
      error: () => { this.isInitializing = false; },
    });
  }

  onBotChange(): void {
    if (this.selectedBotId) this.loadConversations(new HttpParams());
  }

  loadConversations(params: HttpParams): void {
    this.isLoading = true;
    this._conversationService.getConversationsByBot(this.selectedBotId, params).subscribe({
      next: (data) => {
        this.conversations = data.content;
        this.totalElements = data.totalElements;
        this.size = data.size;
        this.pageIndex = data.number;
        this.isPageable = this.totalElements > this.size;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }
}
