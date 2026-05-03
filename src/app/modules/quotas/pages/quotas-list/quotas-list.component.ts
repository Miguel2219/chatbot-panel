import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

import {TableComponent} from '../../../../shared/layouts/table/table.component';
import {TableActions, TableColumn} from '../../../../core/interfaces/table.interface';
import {QuotaService} from '../../services/quota.service';
import {QuotaAdminRowDto, QuotaAdminSummary,} from '../../interfaces/quota-admin-row.interface';

@Component({
  selector: 'app-quotas-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, TableComponent],
  templateUrl: './quotas-list.component.html',
})
export class QuotasListComponent implements OnInit {

  // ─── Summary ─────────────────────────────────────────────
  summary: QuotaAdminSummary = {
    tenantsActive: 0,
    tenantsOnAlert: 0,
    totalExcess: 0,
    totalEstimatedCostCop: 0,
  };

  // ─── Tabla ───────────────────────────────────────────────
  items: QuotaAdminRowDto[] = [];
  isLoading = false;
  hasError = false;

  // La lista no pagina — vienen pocos tenants.
  totalElements = 0;
  isPageable = false;

  actions: TableActions = {
    add: false,
    edit: false,
    delete: false,
    search: true,
  };

  tableColumns: TableColumn[] = [
    { name: 'Tenant',    key: 'tenant_name',              isSortable: false,  dataType: 'text' },
    { name: 'Plan',      key: 'plan_code',                                  dataType: 'text' },
    { name: 'Usadas',    key: 'conversations_count',      isSortable: false, dataType: 'text' },
    { name: 'Límite',    key: 'limit',                                      dataType: 'text' },
    { name: '% Uso',     key: 'percent_used_display',                       dataType: 'text' },
    { name: 'Excesos',   key: 'excess_count',             isSortable: false, dataType: 'text' },
    { name: 'A cobrar',  key: 'estimated_excess_cost_display',              dataType: 'text' },
    { name: 'Ciclo',     key: 'cycle_display',                              dataType: 'text' },
  ];

  constructor(private _quotaService: QuotaService) {}

  ngOnInit(): void {
    this.loadRows();
  }

  private loadRows(): void {
    this.isLoading = true;
    this.hasError = false;
    this._quotaService.getAllAdminRows().subscribe({
      next: (rows) => {
        this.items = rows.map(r => this.decorate(r));
        this.totalElements = this.items.length;
        this.summary = this.computeSummary(rows);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  retry(): void {
    this.loadRows();
  }

  /**
   * Agrega campos de display pre-formateados (evita meter lógica condicional en el template).
   * - `percent_used_display` con 1 decimal y signo %.
   * - `estimated_excess_cost_display` en COP.
   * - `cycle_display` en formato corto `dd/MM → dd/MM`.
   */
  private decorate(row: QuotaAdminRowDto): any {
    return {
      ...row,
      percent_used_display: `${(row.percent_used ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`,
      estimated_excess_cost_display: this.formatCop(row.estimated_excess_cost_cop),
      cycle_display: `${this.shortDate(row.cycle_start)} → ${this.shortDate(row.cycle_end)}`,
    };
  }

  private computeSummary(rows: QuotaAdminRowDto[]): QuotaAdminSummary {
    return rows.reduce<QuotaAdminSummary>((acc, r) => {
      acc.tenantsActive += 1;
      if ((r.percent_used ?? 0) >= 80) acc.tenantsOnAlert += 1;
      acc.totalExcess += r.excess_count ?? 0;
      acc.totalEstimatedCostCop += r.estimated_excess_cost_cop ?? 0;
      return acc;
    }, {
      tenantsActive: 0,
      tenantsOnAlert: 0,
      totalExcess: 0,
      totalEstimatedCostCop: 0,
    });
  }

  // ─── Helpers de formato ──────────────────────────────────
  private formatCop(value: number): string {
    const n = value ?? 0;
    return `$ ${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
  }

  /** `2026-03-15` → `15/03`. Si viene mal formado, devuelve la cadena tal cual. */
  private shortDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const [, mm, dd] = parts;
    return `${dd}/${mm}`;
  }
}
