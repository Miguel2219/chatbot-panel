import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AbstractControl} from '@angular/forms';

/**
 * Label reutilizable para campos de formulario con patrón "error en el label".
 *
 * Antes los errores se pintaban como texto debajo del input (`<span class="input-error">`),
 * lo que hacía que la modal creciera cuando aparecía el error y dejaba al usuario
 * con una UX saltarina. Este componente aplica el patrón inverso: cuando el
 * control asociado es inválido-y-tocado, aparece el texto del error a la derecha
 * del label, al mismo nivel. El alto del bloque no cambia entre estado válido
 * y estado inválido → la modal queda estable.
 *
 * Estilo (ver `_forms.scss`):
 *   - Label: color normal siempre (no se pinta de rojo en error).
 *   - Asterisco de requerido: color del label (no rojo).
 *   - Texto de error: solo texto rojo plano, sin fondo ni pill.
 *
 * Uso típico:
 *   <div class="input-group">
 *     <app-input-label label="Nombre del bot" [required]="true" [control]="nameCtrl" />
 *     <input formControlName="bot_name" />
 *   </div>
 *
 * El texto mostrado se infiere del primer error presente (required → "requerido",
 * email → "email inválido", minlength → "mín. N", etc). Si necesitas un texto
 * específico, pásalo con `errorText`.
 */
// NOTA: Intencionalmente NO se usa ChangeDetectionStrategy.OnPush.
// `markAllAsTouched()` en el submit del form cambia `control.touched` sin
// cambiar la referencia del @Input, y los eventos de touched no emiten por
// `statusChanges`. Con OnPush el getter `showError` no se re-evaluaba y el
// mensaje "requerido" nunca aparecía al intentar enviar un form vacío.
// Este componente es lo bastante liviano como para que el CD default no
// importe en performance.
@Component({
  selector: 'app-input-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="input-label-row">
      <label class="input-label" [attr.for]="inputId || null">
        {{ label }}@if (required) { <span class="input-label-required">*</span> }
      </label>
      @if (showError) {
        <span class="input-error-inline">{{ badgeText }}</span>
      }
    </div>
  `,
})
export class InputLabelComponent {
  @Input({ required: true }) label = '';

  /** Marca el asterisco al lado del label. No fuerza validators — eso es del form. */
  @Input() required = false;

  /**
   * id del input asociado. Cuando se pasa, el `<label for>` queda atado al
   * input por id, lo que: (a) permite click-to-focus, (b) hace que screen
   * readers anuncien el label al enfocar el input. Es opcional para no
   * romper los formularios existentes que aún no lo adoptaron.
   */
  @Input() inputId: string | null = null;

  /** Control que se observa. Si es null/undefined, nunca muestra error. */
  @Input() control: AbstractControl | null | undefined = null;

  /** Texto override del badge. Si no se pasa, se infiere del primer error del control. */
  @Input() errorText: string | null = null;

  /**
   * Fuerza la visualización del error aunque el `control` sea válido. Útil para
   * mostrar errores que viven en el FormGroup (p. ej. "contraseñas no coinciden")
   * asociados a un campo específico.
   */
  @Input() forceError: boolean = false;

  get showError(): boolean {
    if (this.forceError) return true;
    return !!this.control && this.control.invalid && this.control.touched;
  }

  /**
   * Texto que se muestra en el badge. Prioridad:
   *   1. `errorText` si viene explícito.
   *   2. Texto derivado del primer error presente en `control.errors`.
   *   3. Fallback "inválido" (caso defensivo — no debería pasar si showError es true).
   */
  get badgeText(): string {
    if (this.errorText) return this.errorText;
    const errors = this.control?.errors ?? {};
    if (errors['required']) return 'requerido';
    if (errors['email']) return 'email inválido';
    if (errors['pattern']) return 'formato inválido';
    if (errors['minlength']) {
      const n = errors['minlength'].requiredLength;
      return `mín. ${n}`;
    }
    if (errors['maxlength']) {
      const n = errors['maxlength'].requiredLength;
      return `máx. ${n}`;
    }
    if (errors['min']) return `mín. ${errors['min'].min}`;
    if (errors['max']) return `máx. ${errors['max'].max}`;
    return 'inválido';
  }
}
