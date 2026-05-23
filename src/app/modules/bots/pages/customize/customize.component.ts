import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';

import {BotService} from '../../services/bot.service';
import {ResponseBotDto} from '../../interfaces/bot.interface';
import {tenantUsesWidget} from '../../../../core/utils/implementation';

@Component({
  selector: 'app-customize-bot-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './customize.component.html',
})
export class CustomizeBotPageComponent implements OnInit {

  bot: ResponseBotDto | null = null;
  isLoading = true;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _botService: BotService,
  ) {}

  ngOnInit(): void {
    const botId = this._route.snapshot.paramMap.get('bot_id');
    if (!botId) { this._router.navigate(['/administration/bots']); return; }

    this._botService.getBotById(botId).subscribe({
      next: (bot) => {
        this.bot = bot;
        this.isLoading = false;

        // Si el bot no usa widget web y el user aterrizó en /install
        // (refresh, link copiado), redirigirlo a la única tab válida.
        if (!this.showInstallTab && this._router.url.endsWith('/install')) {
          this._router.navigate(['prompt'], { relativeTo: this._route, replaceUrl: true });
        }
      },
      error: () => {
        this.isLoading = false;
        this._router.navigate(['/administration/bots']);
      },
    });
  }

  get showInstallTab(): boolean {
    return tenantUsesWidget(this.bot?.implementation_type);
  }

  // Patrón ARIA tablist con navegación por flechas. Las tabs son <a>
  // con routerLink, por lo que mantenemos role="tab" y movemos el foco
  // sin disparar click — el activeRoute decide la selección.
  onTabKey(event: KeyboardEvent, current: 'prompt' | 'install'): void {
    if (!this.showInstallTab) return;

    const tabs: ('prompt' | 'install')[] = ['prompt', 'install'];
    const idx = tabs.indexOf(current);
    let nextIdx = idx;

    switch (event.key) {
      case 'ArrowRight': nextIdx = (idx + 1) % tabs.length; break;
      case 'ArrowLeft':  nextIdx = (idx - 1 + tabs.length) % tabs.length; break;
      case 'Home':       nextIdx = 0; break;
      case 'End':        nextIdx = tabs.length - 1; break;
      default: return;
    }

    event.preventDefault();
    const next = tabs[nextIdx];
    this._router.navigate([next], { relativeTo: this._route });
    setTimeout(() => document.getElementById(`tab-${next}`)?.focus(), 0);
  }
}
