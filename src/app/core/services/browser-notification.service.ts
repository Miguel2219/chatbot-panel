import {Injectable} from '@angular/core';

/**
 * Wrapper sobre la Web Notification API + sonido via {@link HTMLAudioElement}.
 * Usa assets MP3 servidos desde {@code src/assets/sounds/} (Angular CLI los
 * copia al build por default).
 *
 * <p>Dos sonidos:
 * <ul>
 *   <li>{@code 'pending'} — para ESCALATED (nueva conv pendiente del tenant).
 *       Audible/urgente.</li>
 *   <li>{@code 'message'} — para MESSAGE en una conv asignada al asesor.
 *       Mas sutil.</li>
 * </ul>
 *
 * <p>Si el browser bloquea el autoplay antes del primer gesto del user, el
 * primer beep falla silenciosamente; despues del primer click del asesor los
 * siguientes funcionan normal.
 */
@Injectable({ providedIn: 'root' })
export class BrowserNotificationService {

  private readonly pendingAudio: HTMLAudioElement | null;
  private readonly messageAudio: HTMLAudioElement | null;

  constructor() {
    this.pendingAudio = this.preload('/sounds/pending.mp3');
    this.messageAudio = this.preload('/sounds/message.mp3');
  }

  /** Pide permiso de notificacion. Idempotente. */
  async requestPermission(): Promise<void> {
    if (!this.isSupported()) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
    try {
      await Notification.requestPermission();
    } catch {
      /* swallow — el browser puede tirar si la pagina no es secure context */
    }
  }

  /**
   * Muestra una notificacion del SO. Solo si el documento NO esta visible
   * (tab en background u otra ventana) — si el asesor esta mirando el panel,
   * basta con el sonido y el badge.
   */
  notifyIfHidden(title: string, body: string, tag?: string): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
    try {
      new Notification(title, { body, tag });
    } catch {
      /* swallow */
    }
  }

  /**
   * Reproduce el MP3 del tipo solicitado. {@code currentTime = 0} para que
   * dispare de nuevo si el evento anterior todavia no termino (eventos
   * encadenados rapidos). Errores swallowed — autoplay puede estar bloqueado
   * antes del primer gesto del user.
   */
  playBeep(type: 'pending' | 'message' = 'message'): void {
    const audio = type === 'pending' ? this.pendingAudio : this.messageAudio;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      void audio.play().catch(() => {/* autoplay bloqueado, swallow */});
    } catch {
      /* swallow */
    }
  }

  private preload(src: string): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null;
    try {
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = 0.9;
      return a;
    } catch {
      return null;
    }
  }

  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}
