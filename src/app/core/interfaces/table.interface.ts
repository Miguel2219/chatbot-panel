export interface TableColumn {
  name: string;
  key: string;
  isSortable?: boolean;
  dataType: 'text' | 'date' | 'dateTime' | 'status' | 'badge' | 'currency' | 'boolean';
}

export interface TableActions {
  add: boolean;
  edit: boolean;
  delete: boolean;
  search: boolean;
  customize?: boolean;
}

export const DEFAULT_ACTIONS: TableActions = {
  add: true,
  edit: true,
  delete: true,
  search: true,
};

export interface Pagination {
  limit: number;
  offset: number;
}
