import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dataTypeTable',
  standalone: true,
})
export class DataTypeTablePipe implements PipeTransform {

  transform(value: any, dataType: string): any {
    if (value === null || value === undefined) return 'No aplica';

    switch (dataType) {
      case 'date':
        return this.formatDate(value);

      case 'dateTime':
        return this.formatDateTime(value);

      case 'currency':
        return this.formatCurrency(value);

      case 'boolean':
        return value ? 'Sí' : 'No';

      case 'status':
      case 'badge':
        return value;

      case 'text':
      default:
        return String(value);
    }
  }

  private formatDate(value: string): string {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  }

  private formatDateTime(value: string): string {
    try {
      const date = new Date(value);
      return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  }

  private formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(value);
    } catch {
      return String(value);
    }
  }

}


