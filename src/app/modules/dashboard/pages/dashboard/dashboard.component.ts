import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { BotService } from '../../../bots/services/bot.service';
import { LeadService } from '../../../leads/services/lead.service';
import { ResponseBotDto } from '../../../bots/interfaces/bot.interface';
import { LeadResponseDto } from '../../../leads/interfaces/lead.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  totalBots = 0;
  totalLeads = 0;
  pendingLeads = 0;
  recentBots: ResponseBotDto[] = [];
  recentLeads: LeadResponseDto[] = [];
  isLoading = true;

  private tenantId = '';

  constructor(
    private _auth: AuthService,
    private _botService: BotService,
    private _leadService: LeadService,
  ) {}

  ngOnInit(): void {
    this.tenantId = this._auth.getTenantId();
    this.loadStats();
  }

  private loadStats(): void {
    // this.isLoading = true;
    // this._botService.getBotsByTenant(this.tenantId).subscribe({
    //   next: (bots) => {
    //     this.totalBots = bots.length;
    //     this.recentBots = bots.slice(0, 5);
    //     this.isLoading = false;
    //
    //     if (bots.length > 0) {
    //       this._leadService.getLeadsByBot(bots[0].bot_id).subscribe({
    //         next: (leads) => {
    //           this.totalLeads = leads.length;
    //           this.pendingLeads = leads.filter(l => l.status === 'PENDING').length;
    //           this.recentLeads = leads.slice(0, 5);
    //         },
    //       });
    //     }
    //   },
    //   error: () => { this.isLoading = false; },
    // });
  }
}
