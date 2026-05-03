import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';

import {Select} from '../../../core/interfaces/select.interface';
import {FilterParams} from '../../interfaces/filter-params.interface';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NgSelectModule],
  templateUrl: './filter-panel.component.html',
})
export class FilterPanelComponent {

  @Input() isOpen = false;
  @Input() isAdmin = false;
  @Input() tenants: Select[] = [];
  @Input() bots: Select[] = [];
  @Input() isLoadingBots = false;

  @Output() closed = new EventEmitter<void>();
  @Output() filtersApplied = new EventEmitter<FilterParams>();
  @Output() filtersCleared = new EventEmitter<void>();
  @Output() tenantSelected = new EventEmitter<string>();

  selectedTenantId: string | null = null;
  selectedBotId: string | null = null;

  onTenantChange(): void {
    this.selectedBotId = null;
    if (this.selectedTenantId) {
      this.tenantSelected.emit(this.selectedTenantId);
    }
  }

  apply(): void {
    this.filtersApplied.emit({
      tenantId: this.selectedTenantId,
      botId: this.selectedBotId,
    });
  }

  clear(): void {
    this.selectedTenantId = null;
    this.selectedBotId = null;
    this.filtersCleared.emit();
  }

  close(): void {
    this.closed.emit();
  }

  get isBotSelectDisabled(): boolean {
    if (this.isLoadingBots) return true;
    if (this.isAdmin && !this.selectedTenantId) return true;
    return false;
  }
}
