import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {BotService} from '../../bots/services/bot.service';
import {LeadService} from '../../leads/services/lead.service';

export interface DashboardStats {
  totalBots: number;
  totalLeads: number;
  pendingLeads: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private _botService: BotService,
    private _leadService: LeadService,
  ) {}

  getStats(tenantId: string, botIds: string[]): Observable<DashboardStats> {
    return this._botService.getBotsByTenant(tenantId).pipe(
      map(bots => ({
        totalBots: bots.length,
        totalLeads: 0,
        pendingLeads: 0,
      }))
    );
  }
}
