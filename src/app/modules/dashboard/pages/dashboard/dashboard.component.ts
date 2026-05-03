import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {NgSelectModule} from '@ng-select/ng-select';

import {AuthService} from '../../../../core/services/auth.service';
import {DashboardService} from '../../services/dashboard.service';
import {DashboardSummaryDto} from '../../interfaces/dashboard-summary.interface';
import {TenantsService} from '../../../tenants/services/tenants.service';
import {Select} from '../../../../core/interfaces/select.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NgSelectModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  // ─── Role flags ───────────────────────────────────────────
  isAdmin = false;

  // ─── Tenant picker (solo ADMIN) ──────────────────────────
  tenants: Select[] = [];
  selectedTenantId: string | null = null;
  isLoadingTenants = false;

  // ─── Data ────────────────────────────────────────────────
  summary: DashboardSummaryDto | null = null;
  isLoading = false;
  hasError = false;
  errorMsg = '';

  constructor(
    private _auth: AuthService,
    private _dashboardService: DashboardService,
    private _tenantsService: TenantsService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this._auth.isAdmin();

    if (this.isAdmin) {
      this.initAdminFlow();
    } else {
      // USER: backend resuelve su propio tenant desde el JWT.
      this.loadSummary(null);
    }
  }

  // ─── ADMIN — cargar lista de tenants y pre-seleccionar ────
  private initAdminFlow(): void {
    this.isLoadingTenants = true;
    this._tenantsService.getTenantsSelect().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.selectedTenantId = this.resolveInitialTenantId(tenants);
        this.isLoadingTenants = false;
        if (this.selectedTenantId) {
          this.loadSummary(this.selectedTenantId);
        } else {
          // Sin tenants en el sistema — caso degenerado, mostramos error elegante.
          this.hasError = true;
          this.errorMsg = 'No hay tenants registrados para mostrar métricas.';
        }
      },
      error: () => {
        this.isLoadingTenants = false;
        this.hasError = true;
        this.errorMsg = 'No pudimos cargar la lista de tenants. Intenta de nuevo.';
      },
    });
  }

  /**
   * Reglas:
   *  - Si el ADMIN tiene tenant propio → pre-seleccionar el suyo.
   *  - Si no, el primero de la lista.
   */
  private resolveInitialTenantId(tenants: Select[]): string | null {
    const myTenantId = this._auth.getUser()?.tenant_id ?? null;
    if (myTenantId && tenants.some(t => t.value === myTenantId)) {
      return myTenantId;
    }
    return tenants.length > 0 ? tenants[0].value : null;
  }

  // ─── Handler del ng-select ────────────────────────────────
  onTenantChange(): void {
    if (this.selectedTenantId) {
      this.loadSummary(this.selectedTenantId);
    }
  }

  // ─── Fetch ────────────────────────────────────────────────
  private loadSummary(tenantId: string | null): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMsg = '';
    this._dashboardService.getSummary(tenantId).subscribe({
      next: (data) => {
        this.summary = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMsg = 'No pudimos cargar el resumen. Intenta de nuevo.';
      },
    });
  }

  retry(): void {
    // Si somos ADMIN y todavía no hay lista de tenants (o falló), reintentamos todo el flujo.
    if (this.isAdmin && this.tenants.length === 0) {
      this.initAdminFlow();
      return;
    }
    this.loadSummary(this.selectedTenantId);
  }

  // ─── Helpers para el template ─────────────────────────────

  /** Clampea al rango [0, 100] para que la barra nunca se pase visualmente. */
  get progressWidth(): number {
    const p = this.summary?.conversations_month.percent_used ?? 0;
    return Math.min(Math.max(p, 0), 100);
  }

  /**
   * <80 primary / 80..99 warning / >=100 danger — mismo esquema que el umbral
   * de notificación en el backend (80/100/150).
   */
  get progressLevelClass(): string {
    const p = this.summary?.conversations_month.percent_used ?? 0;
    if (p >= 100) return 'level-danger';
    if (p >= 80) return 'level-warning';
    return 'level-primary';
  }
}
