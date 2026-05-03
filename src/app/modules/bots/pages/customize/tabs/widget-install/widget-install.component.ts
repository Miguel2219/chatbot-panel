import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {ToastrService} from 'ngx-toastr';

import {environment} from '../../../../../../../environments/environment';

@Component({
  selector: 'app-widget-install',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './widget-install.component.html',
})
export class WidgetInstallComponent implements OnInit {

  botId: string | null = null;
  copied = false;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.botId = this._route.parent?.snapshot.paramMap.get('bot_id') ?? null;
    if (!this.botId) this._router.navigate(['/administration/bots']);
  }

  get installSnippet(): string {
    return `<script\n  src="${environment.widgetUrl}"\n  data-bot-id="${this.botId}">\n</script>`;
  }

  async copySnippet(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.installSnippet);
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2000);
    } catch {
      this._toastr.error('No se pudo copiar al portapapeles');
    }
  }
}
