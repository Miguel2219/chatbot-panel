import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule, RouterOutlet} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BreakpointObserver} from '@angular/cdk/layout';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {AuthService} from '../../../../core/services/auth.service';
import {StorageService} from '../../../../core/services/storage.service';
import {InactivityService} from '../../../../core/services/inactivity.service';
import {InboxBusService} from '../../../../core/services/inbox-bus.service';
import {LoadingOverlayComponent} from '../../../../shared/layouts/loading-overlay/loading-overlay.component';
import {
  SessionTimeoutModalComponent,
  SessionTimeoutResult,
} from '../../../../shared/components/session-timeout-modal/session-timeout-modal.component';
import {environment} from '../../../../../environments/environment';
import {ModulePermissions} from '../../../auth/interfaces/auth.interface';

@Component({
  selector: 'app-main-administration',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, MatIconModule, LoadingOverlayComponent],
  templateUrl: './main-administration.component.html',
})
export class MainAdministrationComponent implements OnInit, OnDestroy {

  navItems: ModulePermissions[] = []

  /**
   * Override de display label para módulos cuya etiqueta en backend es técnica
   * (Bots, Leads) y queremos mostrar al cliente algo entendible (Asistentes,
   * Contactos). El backend sigue siendo source-of-truth para todo lo demás.
   */
  private readonly MODULE_DISPLAY_OVERRIDES: Record<string, string> = {
    'bots':  'Asistentes',
    'leads': 'Contactos',
  };

  displayLabel(item: ModulePermissions): string {
    return this.MODULE_DISPLAY_OVERRIDES[item.route] ?? item.name;
  }
  sidebarOpen = false;
  isSmallScreen = false;
  userName = '';
  userInitials = '';
  userEmail = '';

  /** Contador en vivo de pendientes — empujado por InboxBusService via SSE. */
  pendingCount$: Observable<number>;

  private destroy$ = new Subject<void>();
  private timeoutDialogRef: MatDialogRef<SessionTimeoutModalComponent, SessionTimeoutResult> | null = null;
  /**
   * Mantiene a raya refreshes preventivos en cascada si el user ciclea
   * visibilidad varias veces antes de que la respuesta llegue. El flag
   * se baja en success/error del observable.
   */
  private preemptiveRefreshInFlight = false;
  // TODO(MVP): flag del botón "logout-all". Reactivar cuando vuelva.
  // logoutAllInFlight = false;

  constructor(
    private _auth: AuthService,
    private _storage: StorageService,
    private _router: Router,
    private _inactivity: InactivityService,
    private _inboxBus: InboxBusService,
    private _dialog: MatDialog,
    // TODO(MVP): reinyectar ToastrService cuando vuelva logoutAllDevices().
    // private _toastr: ToastrService,
    private breakpointObserver: BreakpointObserver,
  ) {
    this.pendingCount$ = this._inboxBus.pendingCount$.asObservable();
  }

  ngOnInit(): void {
    this.getModules();
    this.loadUserInfo();
    // El backend ya filtra el modulo Inbox para admin via
    // PermissionService.getModulesForUser. Si llego en navItems es porque el
    // usuario corresponde a un rol con inbox.view asignado — arrancamos el
    // bus SSE para tener el contador en vivo del badge.
    if (this.navItems.some(m => m.route === 'inbox')) {
      this._inboxBus.start();
    }
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.isSmallScreen = result.matches;
      if (!result.matches) this.sidebarOpen = false;
    });

    // Cierre de sesión por inactividad. El service detecta sólo
    // interacción humana (click/keydown/mousemove/scroll/touchstart);
    // polling HTTP NO resetea el timer. Ver InactivityService.
    this._inactivity.start();
    this._inactivity.warning$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.openTimeoutModal());
    this._inactivity.timeout$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Si el user ya cerró el modal con 'continue' no llegamos
        // acá. Si lo dejó abierto hasta el final, MatDialog ya se
        // cerró solo con 'timeout' — cerramos igual por si acaso.
        this.timeoutDialogRef?.close('timeout');
        this._auth.logout('inactivity');
      });

    // Refresh preventivo al despertar. Cuando el tab vuelve de
    // background/suspend y el AT está por expirar, disparamos un
    // refresh antes de que las requests del dashboard empiecen a
    // lloverle al backend con 401s. Si el refresh falla, el user
    // va a /auth?reason=expired (más honesto que "te quedaste sin
    // permiso" porque el token ya no sirve).
    this._inactivity.visibilityReturn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.tryPreemptiveRefresh());
  }

  ngOnDestroy(): void {
    this._inactivity.stop();
    this._inboxBus.stop();
    this.timeoutDialogRef?.close();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserInfo(): void {
    const user = this._auth.getUser();
    if (user) {
      this.userName = user.name ?? 'Usuario';
      this.userEmail = user.email ?? '';
      this.userInitials = this.getInitials(this.userName);
    }
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  private getModules(): ModulePermissions[] {
    const all = this._storage.getModules() ?? [];
    this.navItems = all
      .filter(m => m.permissions?.['view'] === true)
      .sort((a, b) => a.display_order - b.display_order);
    return this.navItems;
  }

  private openTimeoutModal(): void {
    if (this.timeoutDialogRef) return; // ya abierto — idempotente

    this.timeoutDialogRef = this._dialog.open(SessionTimeoutModalComponent, {
      width: '420px',
      disableClose: true,
      data: { remainingMs: environment.session.inactivityWarningMs },
    });

    this.timeoutDialogRef.afterClosed().subscribe((result) => {
      this.timeoutDialogRef = null;
      switch (result) {
        case 'continue':
          this._inactivity.reset();
          break;
        case 'logout':
          this._auth.logout('manual');
          break;
        case 'timeout':
          // El logout por timeout lo dispara timeout$ (arriba).
          // Si llegamos acá sin esa señal, es un race — forzamos.
          this._auth.logout('inactivity');
          break;
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    if (this.isSmallScreen) this.sidebarOpen = false;
  }

  logout(): void {
    this._auth.logout('manual');
  }

  // TODO(MVP): "Cerrar sesión en todos los dispositivos". Reactivar junto
  // con AuthService.logoutAllDevices() + el endpoint backend + el botón.
  //
  // /**
  //  * Dispara el endpoint que revoca TODOS los refresh tokens del user en el
  //  * backend y luego limpia local como un logout normal. Confirmación vía
  //  * window.confirm — no hace falta un MatDialog dedicado para una acción
  //  * tan puntual.
  //  */
  // logoutAllDevices(): void {
  //   if (this.logoutAllInFlight) return;
  //   const ok = window.confirm(
  //     'Esto cerrará tu sesión en TODOS los dispositivos donde tengas Zolvion abierto. ' +
  //     '¿Continuar?',
  //   );
  //   if (!ok) return;
  //
  //   this.logoutAllInFlight = true;
  //   this._auth.logoutAllDevices().subscribe({
  //     next: () => {
  //       this._toastr.success('Cerramos todas tus sesiones activas.', 'Listo');
  //       // Limpieza local + redirect. No reusamos logout('manual') porque
  //       // ya llamamos a un endpoint distinto; el logout tradicional
  //       // intentaría revocar el RT actual otra vez (que ya está revocado).
  //       this._auth.logout('manual');
  //     },
  //     error: () => {
  //       this.logoutAllInFlight = false;
  //       this._toastr.error(
  //         'No se pudieron cerrar las sesiones. Intenta de nuevo o vuelve a iniciar sesión.',
  //       );
  //     },
  //   });
  // }

  /**
   * Llamado al volver de background/suspend. Si el AT está cerca de
   * vencer (menos de 15 min de vida útil), lo rotamos ya — así evitamos
   * la ráfaga de 401 cuando el router remonta componentes que disparan
   * requests en su ngOnInit.
   */
  private tryPreemptiveRefresh(): void {
    if (this.preemptiveRefreshInFlight) return;
    if (!this._auth.isLoggedIn()) return;
    if (!this._auth.isAccessTokenNearExpiry()) return;

    this.preemptiveRefreshInFlight = true;
    this._auth.refreshToken().subscribe({
      next: () => { this.preemptiveRefreshInFlight = false; },
      error: () => {
        this.preemptiveRefreshInFlight = false;
        this._auth.logout('expired');
      },
    });
  }

  getCurrentPageTitle(): string {
    const url = this._router.url;
    const item = this.navItems.find(n => url.includes(n.route));
    return item ? this.displayLabel(item) : 'Panel';
  }
}
