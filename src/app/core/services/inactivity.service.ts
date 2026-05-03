import {Injectable, NgZone, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {environment} from '../../../environments/environment';

/**
 * Detecta inactividad del usuario y emite eventos:
 *
 * - {@code warning$}: se dispara {@code inactivityWarningMs} antes del
 *   timeout total — el layout abre el modal con countdown.
 * - {@code timeout$}: se dispara al cumplirse {@code inactivityTimeoutMs}
 *   sin interacción — el layout llama {@code AuthService.logout('inactivity')}.
 * - {@code visibilityReturn$}: se dispara cuando el tab vuelve a estar
 *   visible (user regresa tras suspender el PC, cambiar de pestaña, etc).
 *   El layout lo usa para disparar un refresh preventivo si el AT está por
 *   vencer.
 *
 * Diseño:
 * - Sólo interacción humana resetea los timers (click/keydown/mousemove/
 *   scroll/touchstart). El tráfico HTTP (polling de conversations,
 *   refresh silencioso, etc.) NO extiende la sesión — si el user no
 *   está tocando nada, la sesión muere aunque haya llamadas de fondo.
 * - <b>Wall-clock, no setTimeout.</b> Los timers de JS se pausan cuando
 *   el OS suspende el equipo (o cuando el tab pasa a background con
 *   throttling agresivo): si dejaras el PC dormido 3 horas, un
 *   {@code setTimeout(30min)} despertaría cuando ya pasaron 3 h de wall
 *   clock pero sólo ejecutó ~30 min de tiempo real — el layout nunca se
 *   entera de la inactividad. Por eso usamos un heartbeat cada 10 s que
 *   compara {@code Date.now() - lastActivityAt} contra los thresholds.
 *   Al volver del suspend, el primer heartbeat (o el handler de
 *   {@code visibilitychange}) detecta que pasó mucho tiempo y dispara
 *   timeout$ inmediatamente.
 * - Listeners corren fuera de NgZone para no disparar CD en cada
 *   mousemove. Debounce manual con timestamp evita el overhead de
 *   {@code fromEvent + debounceTime}.
 * - {@code start()} es idempotente — el layout lo llama en cada
 *   {@code ngOnInit} sin riesgo de listeners duplicados.
 */
@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {

  /** Emite cuando faltan {@code inactivityWarningMs} para el timeout. */
  readonly warning$ = new Subject<void>();
  /** Emite al cumplirse {@code inactivityTimeoutMs} sin interacción. */
  readonly timeout$ = new Subject<void>();
  /**
   * Emite cuando el tab recupera visibilidad (visibilitychange→visible
   * o focus). El layout lo usa para evaluar si el AT está por vencer y
   * disparar un refresh preventivo antes de que las primeras requests
   * del dashboard exploten con 401.
   */
  readonly visibilityReturn$ = new Subject<void>();

  /**
   * Timestamp (Date.now()) de la última interacción humana. Fuente de
   * verdad para todas las decisiones — NO confíes en la "edad" de los
   * timers de JS porque se pausan con el OS.
   */
  private lastActivityAt = 0;

  /**
   * Flag de "ya emitimos warning$ en este ciclo". Evita re-emitir en
   * cada heartbeat mientras el user sigue inactivo con el modal abierto.
   * Se resetea en {@code reset()} y cuando una interacción baja el idle
   * por debajo del threshold de warning.
   */
  private warningEmitted = false;

  /**
   * Flag de "ya emitimos timeout$ en este ciclo". Evita re-emit si el
   * heartbeat sigue corriendo un tick más antes de que el layout llame
   * a {@code stop()}.
   */
  private timeoutEmitted = false;

  private heartbeatId: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private unlisteners: Array<() => void> = [];

  private readonly timeoutMs = environment.session.inactivityTimeoutMs;
  private readonly warningMs = environment.session.inactivityWarningMs;
  private readonly debounceMs = environment.session.activityDebounceMs;
  /**
   * Cada cuánto revisamos el idle vs wall-clock. 10 s = latencia máxima
   * antes de detectar el timeout. Menos que eso sería overhead gratis
   * (el cierre no es time-critical al segundo).
   */
  private readonly heartbeatMs = 10 * 1000;

  private readonly activityEvents: Array<{ name: keyof WindowEventMap; passive: boolean }> = [
    { name: 'click',      passive: true  },
    { name: 'keydown',    passive: true  },
    { name: 'mousemove',  passive: true  },
    { name: 'scroll',     passive: true  },
    { name: 'touchstart', passive: true  },
  ];

  constructor(private _ngZone: NgZone) {}

  /**
   * Arranca los listeners + heartbeat. Idempotente — si ya está corriendo,
   * no-op.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastActivityAt = Date.now();
    this.warningEmitted = false;
    this.timeoutEmitted = false;

    this._ngZone.runOutsideAngular(() => {
      // ─── Eventos de interacción humana ─────────────────────────
      for (const { name, passive } of this.activityEvents) {
        const handler = () => this.onActivity();
        const options: AddEventListenerOptions = { passive };
        window.addEventListener(name, handler, options);
        this.unlisteners.push(() =>
          window.removeEventListener(name, handler, options),
        );
      }

      // ─── Vuelta del tab a visible ──────────────────────────────
      // Cuando el OS suspende el equipo o el user cambia de tab, los
      // timers quedan pausados y no detectan el paso del tiempo. Al
      // volver visible, forzamos un check inmediato (el heartbeat
      // puede demorar hasta 10 s más en ejecutar su próxima vuelta).
      const onVisibility = () => {
        if (document.visibilityState === 'visible') {
          this.checkIdleNow();
          this._ngZone.run(() => this.visibilityReturn$.next());
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      this.unlisteners.push(() =>
        document.removeEventListener('visibilitychange', onVisibility),
      );

      // Algunos navegadores (iOS Safari con sleep de pantalla, ciertos
      // WMs Linux) dejan el documento "visible" pero no entregan
      // timers durante el sleep. El focus cubre esos casos cuando el
      // user vuelve a interactuar con la ventana.
      const onFocus = () => {
        this.checkIdleNow();
        this._ngZone.run(() => this.visibilityReturn$.next());
      };
      window.addEventListener('focus', onFocus);
      this.unlisteners.push(() => window.removeEventListener('focus', onFocus));

      // ─── Heartbeat cada 10 s ───────────────────────────────────
      // setInterval también se pausa con el OS, pero al volver emite
      // los ticks pendientes en ráfaga. El visibilitychange cubre el
      // caso borde del primer check tras el sleep.
      this.heartbeatId = setInterval(() => this.checkIdleNow(), this.heartbeatMs);
    });
  }

  /**
   * Para los listeners + heartbeat. Safe-to-call en cualquier momento
   * (incluso si {@code start()} no se había llamado).
   */
  stop(): void {
    this.running = false;
    this.clearHeartbeat();
    for (const unlisten of this.unlisteners) unlisten();
    this.unlisteners = [];
  }

  /**
   * Reinicia el timer lógico (sin tocar listeners). Usado cuando el user
   * hace click en "Continuar sesión" — el modal se cierra y los 30 min
   * empiezan de nuevo.
   */
  reset(): void {
    if (!this.running) return;
    this.lastActivityAt = Date.now();
    this.warningEmitted = false;
    this.timeoutEmitted = false;
  }

  ngOnDestroy(): void {
    this.stop();
    this.warning$.complete();
    this.timeout$.complete();
    this.visibilityReturn$.complete();
  }

  // ─── privados ────────────────────────────────────────────────────────

  private onActivity(): void {
    const now = Date.now();
    if (now - this.lastActivityAt < this.debounceMs) return;
    this.lastActivityAt = now;

    // Cualquier interacción "borra" el idle acumulado, así que re-armamos
    // el flag de warning. Sin esto, tras emitir warning$ una vez, el
    // layout nunca vería un warning nuevo aunque el user entrara y
    // saliera de actividad varias veces. No tocamos timeoutEmitted: si
    // ya pasó el timeout, stop() va a correr y el siguiente start()
    // lo resetea.
    this.warningEmitted = false;
  }

  /**
   * Núcleo del service. Mira el wall-clock, compara con lastActivityAt y
   * decide si emitir warning$ o timeout$. Llamado por el heartbeat, por
   * visibilitychange y por focus.
   */
  private checkIdleNow(): void {
    if (!this.running) return;
    if (this.timeoutEmitted) return; // ya disparamos timeout en este ciclo

    // Math.max por si el reloj del sistema cambió hacia atrás entre
    // la última actividad y ahora (DST, NTP skew, etc): no queremos
    // "idle negativo" interpretándose como idle gigante por overflow.
    const idle = Math.max(0, Date.now() - this.lastActivityAt);

    if (idle >= this.timeoutMs) {
      this.timeoutEmitted = true;
      this._ngZone.run(() => this.timeout$.next());
      return;
    }

    if (idle >= this.timeoutMs - this.warningMs && !this.warningEmitted) {
      this.warningEmitted = true;
      this._ngZone.run(() => this.warning$.next());
    }
  }

  private clearHeartbeat(): void {
    if (this.heartbeatId !== null) {
      clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
  }
}
