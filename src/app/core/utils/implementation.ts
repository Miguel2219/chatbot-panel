// ─── Tenant implementation type ──────────────────────────────────
// Espejo del enum backend `ImplementationType`. Define por qué canal
// está expuesto el chatbot del tenant: sitio web (WIDGET), WhatsApp
// o ambos.
export const ImplementationType = {
  WIDGET:   'WIDGET',
  WHATSAPP: 'WHATSAPP',
  BOTH:     'BOTH',
} as const;
export type ImplementationType = typeof ImplementationType[keyof typeof ImplementationType];

// ─── User notification channel ──────────────────────────────────
// Espejo del enum backend `NotificationChannel`. Canal por el que el
// asesor/owner recibe notificaciones cuando el bot cede control a un
// humano (handoff) o cuando se le asigna un lead.
export const NotificationChannel = {
  EMAIL:    'EMAIL',
  WHATSAPP: 'WHATSAPP',
} as const;
export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

// Opciones para los selects (label en español, value que matchea el enum
// del backend). Centralizado para que los 4 flujos (crear/editar tenant,
// crear/editar usuario) muestren las mismas etiquetas.
export const NOTIFICATION_CHANNEL_OPTIONS: ReadonlyArray<{ label: string; value: NotificationChannel }> = [
  { label: 'Email',    value: 'EMAIL'    },
  // Pre-launch: solo email. Reactivar cuando se implemente la notificación
  // WhatsApp a asesores. Mientras esté comentada, el backend nunca entra al
  // branch `if (channel == NotificationChannel.WHATSAPP)` de NotificationService.
  // { label: 'WhatsApp', value: 'WHATSAPP' }
];

/**
 * Regla de negocio única: el `notification_channel` de un usuario sólo
 * tiene sentido cuando el tenant tiene canal web (WIDGET o BOTH). Para
 * tenants WHATSAPP, el asesor recibe notificaciones por WhatsApp por
 * defecto, por lo que el campo es innecesario.
 *
 * Esta función debe usarse desde los formularios (crear/editar tenant,
 * crear/editar usuario) tanto para decidir visibilidad como para decidir
 * si agregar/quitar el validador `required`. Mantenerla como única fuente
 * de verdad evita que cada componente reimplemente la regla.
 *
 * Acepta `string` además de `ImplementationType` porque los valores que
 * vienen del storage / backend / forms están tipados ampliamente como
 * string en muchos lugares del frontend.
 */
export function requiresNotificationChannel(implType: string | null | undefined): boolean {
  return implType === ImplementationType.WIDGET || implType === ImplementationType.BOTH;
}

/**
 * Misma regla que `requiresNotificationChannel` pero expresada con nombre
 * semántico distinto: indica si un bot de este tenant requiere que se le
 * asignen responsables (users que reciban leads por round-robin). Solo
 * aplica a WIDGET/BOTH — los leads de WhatsApp no pasan por round-robin.
 *
 * Se expone como alias y no como función duplicada para no romper el
 * invariante "una única fuente de verdad" de la regla de implementación.
 */
export const tenantUsesLeadAssignees = requiresNotificationChannel;
