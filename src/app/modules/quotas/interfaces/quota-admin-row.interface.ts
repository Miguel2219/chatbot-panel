export interface QuotaAdminRowDto {
  tenant_id: string;
  tenant_name: string;
  plan_code: string;
  /** `YYYY-MM-DD` en zona Bogotá (inclusive). */
  cycle_start: string;
  /** `YYYY-MM-DD` en zona Bogotá (inclusive). */
  cycle_end: string;
  conversations_count: number;
  limit: number;
  percent_used: number;
  excess_count: number;
  estimated_excess_cost_cop: number;
}

export interface QuotaAdminSummary {
  /** Total de tenants con fila en el ciclo vigente. */
  tenantsActive: number;
  /** Tenants cuyo {@code percent_used >= 80}. */
  tenantsOnAlert: number;
  /** Suma de {@code excess_count} de todos los tenants. */
  totalExcess: number;
  /** Suma de {@code estimated_excess_cost_cop} — cuánto se facturará este mes por excesos. */
  totalEstimatedCostCop: number;
}
