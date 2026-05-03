import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'roleLabel',
  standalone: true,
  pure: true,
})
export class RoleLabelPipe implements PipeTransform {

  private static readonly LABELS: Record<string, string> = {
    ADMIN: 'Administrador Zolvion',
    TENANT_OWNER: 'Administrador de empresa',
    USER: 'Usuario',
  };

  static label(value: string | null | undefined): string {
    if (!value) return '';
    return RoleLabelPipe.LABELS[value] ?? value;
  }

  transform(value: string | null | undefined): string {
    return RoleLabelPipe.label(value);
  }
}
