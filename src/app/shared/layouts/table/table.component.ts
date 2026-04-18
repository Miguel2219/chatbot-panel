import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver } from '@angular/cdk/layout';

import { TableActions, TableColumn, DEFAULT_ACTIONS } from '../../../core/interfaces/table.interface';
import { DataTypeTablePipe } from '../../pipes/data-type-table.pipe';

function createSpanishPaginator(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Registros por página';
  paginatorIntl.nextPageLabel = 'Siguiente';
  paginatorIntl.previousPageLabel = 'Anterior';
  paginatorIntl.firstPageLabel = 'Primera página';
  paginatorIntl.lastPageLabel = 'Última página';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return 'Sin registros';
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return `${start} – ${end} de ${length}`;
  };
  return paginatorIntl;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    DataTypeTablePipe,
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: createSpanishPaginator },
  ],
  templateUrl: './table.component.html',
})
export class TableComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ─── Inputs ───────────────────────────────────────────────
  @Input() titleTable: string = 'Lista';
  @Input() tableColumns: TableColumn[] = [];
  @Input() set tableData(data: any[]) {
    this.dataSource.data = data ?? [];
  }
  @Input() pageSize: number = 10;
  @Input() pageIndex: number = 0;
  @Input() totalElements: number = 0;
  @Input() isPageable: boolean = true;
  @Input() actions: TableActions = DEFAULT_ACTIONS;
  @Input() addActionName: string = 'Nuevo';
  @Input() isLoading: boolean = false;

  // ─── Outputs ──────────────────────────────────────────────
  @Output() add    = new EventEmitter<void>();
  @Output() edit   = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() filter = new EventEmitter<HttpParams>();

  // ─── Internal state ───────────────────────────────────────
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  searchControl = new FormControl('');
  isSmallScreen = false;
  skeletonRows = [1, 2, 3, 4, 5];

  private currentSearch = '';
  private currentSort: Sort | null = null;
  private currentPage: PageEvent | null = null;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.buildDisplayedColumns();
    this.breakpointObserver.observe(['(max-width: 576px)']).subscribe(result => {
      this.isSmallScreen = result.matches;
    });
  }

  private buildDisplayedColumns(): void {
    this.displayedColumns = this.tableColumns.map(c => c.name);
    if (this.actions.edit || this.actions.delete) {
      this.displayedColumns.push('actions');
    }
  }

  // ─── Cell value ───────────────────────────────────────────
  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], row);
  }

  // ─── Status badge class ───────────────────────────────────
  getStatusClass(value: any): string {
    const v = String(value).toUpperCase();
    if (['ACTIVE', 'TRUE', 'ACTIVO', 'CONTACTED'].includes(v)) return 'badge badge-success';
    if (['PENDING', 'PENDIENTE', 'BOT_ACTIVE'].includes(v)) return 'badge badge-pending';
    if (['INACTIVE', 'FALSE', 'INACTIVO', 'CLOSED'].includes(v)) return 'badge badge-danger';
    if (['WARNING', 'HUMAN_ACTIVE', 'PENDING_HUMAN'].includes(v)) return 'badge badge-warning';
    return 'badge badge-info';
  }

  getStatusLabel(value: any): string {
    const map: Record<string, string> = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'TRUE': 'Activo',
      'FALSE': 'Inactivo',
      'PENDING': 'Pendiente',
      'CONTACTED': 'Contactado',
      'CLOSED': 'Cerrado',
      'BOT_ACTIVE': 'Bot activo',
      'HUMAN_ACTIVE': 'Agente activo',
      'PENDING_HUMAN': 'Esperando agente',
    };
    return map[String(value).toUpperCase()] ?? String(value);
  }

  // ─── Search ───────────────────────────────────────────────
  applySearch(): void {
    this.currentSearch = (this.searchControl.value ?? '').trim();
    this.emitFilter();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.currentSearch = '';
    this.emitFilter();
  }

  // ─── Sort ─────────────────────────────────────────────────
  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.emitFilter();
  }

  // ─── Pagination ───────────────────────────────────────────
  onPageChange(page: PageEvent): void {
    this.currentPage = page;
    this.emitFilter();
  }

  // ─── Emit filter ──────────────────────────────────────────
  private emitFilter(): void {
    let params = new HttpParams();

    if (this.currentSearch) {
      params = params.set('search', this.currentSearch);
    }

    if (this.currentSort?.active && this.currentSort.direction) {
      params = params.set('order_by', this.currentSort.active);
      params = params.set('order', this.currentSort.direction);
    }

    if (this.currentPage) {
      params = params.set('limit', this.currentPage.pageSize);
      params = params.set('offset', this.currentPage.pageIndex);
    } else {
      params = params.set('limit', this.pageSize);
      params = params.set('offset', this.pageIndex);
    }

    this.filter.emit(params);
  }
}
