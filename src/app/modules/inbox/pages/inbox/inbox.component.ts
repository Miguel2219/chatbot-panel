import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {Subscription} from 'rxjs';
import {ToastrService} from 'ngx-toastr';

import {InboxService} from '../../services/inbox.service';
import {InboxBusService} from '../../../../core/services/inbox-bus.service';
import {AuthService} from '../../../../core/services/auth.service';
import {
  ConversationThreadResponseDto,
  ConversationThreadSummaryDto,
  MessageResponseDto,
} from '../../../conversations/interfaces/conversation.interface';
import {InboxEvent} from '../../interfaces/inbox.interface';

type Tab = 'pending' | 'mine';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
})
export class InboxComponent implements OnInit, OnDestroy {

  tab: Tab = 'pending';

  pending: ConversationThreadSummaryDto[] = [];
  mine: ConversationThreadSummaryDto[] = [];
  isLoadingList = false;

  // Contadores vivos del bus — para badges en los tabs (B1).
  pendingCount = 0;
  mineCount = 0;

  selectedId: string | null = null;
  selectedThread: ConversationThreadResponseDto | null = null;
  selectedMessages: MessageResponseDto[] = [];
  isLoadingDetail = false;

  replyText = '';
  isSendingReply = false;
  isClaiming = false;
  isResolving = false;

  // Scroll state del thread (estilo WhatsApp).
  // isAtBottom: el user esta dentro del umbral inferior del scroll (auto-scroll
  //   en MESSAGE entrantes esta permitido).
  // unreadInView: mensajes que llegaron mientras estaba scrolleado para arriba
  //   — se muestran en el badge del boton flotante "ir al fondo".
  @ViewChild('timelineRef') timelineRef?: ElementRef<HTMLElement>;
  private static readonly BOTTOM_THRESHOLD_PX = 200;
  isAtBottom = true;
  unreadInView = 0;

  private currentUserId: string;
  private eventsSub?: Subscription;
  private pendingCountSub?: Subscription;
  private mineCountSub?: Subscription;

  constructor(
    private _inbox: InboxService,
    private _bus: InboxBusService,
    private _auth: AuthService,
    private _toastr: ToastrService,
    private _cdr: ChangeDetectorRef,
  ) {
    this.currentUserId = this._auth.getUser()?.user_id ?? '';
  }

  ngOnInit(): void {
    // requestPermission y start() ya los maneja el bus desde el shell.
    this._bus.start();
    this.loadActiveTab();

    this.eventsSub = this._bus.events$.subscribe(evt => this.onEvent(evt));
    this.pendingCountSub = this._bus.pendingCount$.subscribe(n => {
      this.pendingCount = n;
      this._cdr.markForCheck();
    });
    this.mineCountSub = this._bus.mineCount$.subscribe(n => {
      this.mineCount = n;
      this._cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.eventsSub?.unsubscribe();
    this.pendingCountSub?.unsubscribe();
    this.mineCountSub?.unsubscribe();
  }

  // ---------- tabs / list ----------

  setTab(tab: Tab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.selectedId = null;
    this.selectedThread = null;
    this.selectedMessages = [];
    this.loadActiveTab();
  }

  get currentList(): ConversationThreadSummaryDto[] {
    return this.tab === 'pending' ? this.pending : this.mine;
  }

  private loadActiveTab(): void {
    this.isLoadingList = true;
    const obs = this.tab === 'pending' ? this._inbox.getPending() : this._inbox.getMine();
    obs.subscribe({
      next: (page) => {
        if (this.tab === 'pending') this.pending = page.content ?? [];
        else this.mine = page.content ?? [];
        this.isLoadingList = false;
      },
      error: () => { this.isLoadingList = false; },
    });
  }

  trackById(_index: number, item: ConversationThreadSummaryDto): string {
    return item.conversation_id;
  }

  // ---------- detail ----------

  select(item: ConversationThreadSummaryDto): void {
    if (this.selectedId === item.conversation_id) return;
    this.selectedId = item.conversation_id;
    // Reset del estado de scroll para la conv recien abierta — arrancamos
    // asumiendo "estoy al fondo" para no mostrar el boton hasta que el user
    // scrollee manualmente.
    this.isAtBottom = true;
    this.unreadInView = 0;
    this.loadDetail(item.conversation_id);
    this.markConversationRead(item.conversation_id);
  }

  /**
   * Handler del scroll del timeline. Actualiza {@link isAtBottom} comparando la
   * distancia del scroll al fondo contra {@link BOTTOM_THRESHOLD_PX}. Si el user
   * llego al fondo manualmente, resetea el contador de no-leidos del badge.
   */
  onTimelineScroll(): void {
    const el = this.timelineRef?.nativeElement;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const wasAtBottom = this.isAtBottom;
    this.isAtBottom = distance < InboxComponent.BOTTOM_THRESHOLD_PX;
    if (this.isAtBottom && !wasAtBottom) {
      this.unreadInView = 0;
    }
  }

  /**
   * Lleva el thread al fondo. Usa doble {@code requestAnimationFrame} para
   * esperar a que Angular renderice el nuevo bubble (1er frame) Y a que el
   * browser termine el layout (2do frame) antes de medir {@code scrollHeight}.
   *
   * <p>Sin esto, al enviar/recibir un mensaje el scroll queda en el penultimo:
   * {@code scrollHeight} todavia devuelve el alto previo a que el browser haya
   * computado el layout del nuevo bubble. Con {@code setTimeout(0)} pasa porque
   * el macrotask fire antes del paint. Con doble rAF fire justo antes del paint
   * con layout ya computado.
   */
  scrollToBottom(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = this.timelineRef?.nativeElement;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        this.isAtBottom = true;
        this.unreadInView = 0;
      });
    });
  }

  /**
   * Avisa al backend que el asesor abrio la conv → resetea unread_count a 0.
   * Optimistamente lo refleja en la lista local + refresca el total global del
   * bus para que el title decremente.
   */
  private markConversationRead(id: string): void {
    this._inbox.markRead(id).subscribe({
      next: () => {
        const idx = this.mine.findIndex(c => c.conversation_id === id);
        if (idx >= 0) {
          this.mine[idx] = { ...this.mine[idx], unread_count: 0 };
          this.mine = [...this.mine]; // trigger change detection
        }
        const idxPending = this.pending.findIndex(c => c.conversation_id === id);
        if (idxPending >= 0) {
          this.pending[idxPending] = { ...this.pending[idxPending], unread_count: 0 };
          this.pending = [...this.pending];
        }
        this._bus.refreshUnreadMineTotal();
        this._cdr.markForCheck();
      },
      // si falla, no rompemos UX — el badge se actualizara en el proximo refresh
    });
  }

  private loadDetail(id: string): void {
    this.isLoadingDetail = true;
    this.selectedThread = null;
    this.selectedMessages = [];

    this._inbox.getConversation(id).subscribe({
      next: (thread) => { this.selectedThread = thread; },
      error: () => { this._toastr.error('No se pudo cargar la conversación'); },
    });
    this._inbox.getMessages(id).subscribe({
      next: (msgs) => {
        this.selectedMessages = msgs;
        this.isLoadingDetail = false;
        // Conv recien abierta → arrancar al fondo (mensaje mas reciente visible).
        this.scrollToBottom();
      },
      error: () => {
        this._toastr.error('No se pudieron cargar los mensajes');
        this.isLoadingDetail = false;
      },
    });
  }

  get canReply(): boolean {
    return !!this.selectedThread
        && this.selectedThread.status === 'HUMAN_ACTIVE'
        && this.selectedThread.assigned_adviser_id === this.currentUserId;
  }

  get canClaim(): boolean {
    return !!this.selectedThread && this.selectedThread.status === 'PENDING_HUMAN';
  }

  get canResolve(): boolean {
    return !!this.selectedThread
        && this.selectedThread.status === 'HUMAN_ACTIVE'
        && this.selectedThread.assigned_adviser_id === this.currentUserId;
  }

  claim(): void {
    if (!this.selectedThread) return;
    this.isClaiming = true;
    const id = this.selectedThread.conversation_id;
    this._inbox.claim(id).subscribe({
      next: () => {
        this.isClaiming = false;
        this._toastr.success('Conversación tomada');
        // Auto-switch a "Mias" para que la conv recien tomada quede visible en
        // la lista de la izquierda sin que el asesor tenga que clickear el tab.
        // El selectedId se mantiene → el detalle sigue mostrando la conv.
        this.tab = 'mine';
        this.loadActiveTab();
        this.loadDetail(id);
      },
      error: (err) => {
        this.isClaiming = false;
        if (err?.status === 409) {
          this._toastr.warning('Otro asesor tomó esta conversación primero');
          this.loadActiveTab();
          this.selectedId = null;
          this.selectedThread = null;
        } else {
          this._toastr.error('No se pudo tomar la conversación');
        }
      },
    });
  }

  resolve(): void {
    if (!this.selectedThread) return;
    this.isResolving = true;
    const id = this.selectedThread.conversation_id;
    this._inbox.resolve(id).subscribe({
      next: () => {
        this.isResolving = false;
        this._toastr.success('Conversación resuelta');
        this.loadActiveTab();
        this.selectedId = null;
        this.selectedThread = null;
        this.selectedMessages = [];
      },
      error: () => {
        this.isResolving = false;
        this._toastr.error('No se pudo resolver la conversación');
      },
    });
  }

  sendReply(): void {
    if (!this.selectedThread || !this.replyText.trim()) return;
    this.isSendingReply = true;
    const id = this.selectedThread.conversation_id;
    const text = this.replyText;
    this._inbox.reply(id, text).subscribe({
      next: (msg) => {
        this.selectedMessages = [...this.selectedMessages, msg];
        this.replyText = '';
        this.isSendingReply = false;
        // Al enviar siempre bajamos — el asesor quiere ver su mensaje recien
        // mandado, no importa donde estuviera mirando antes.
        this.scrollToBottom();
      },
      error: (err) => {
        this.isSendingReply = false;
        if (err?.status === 409) {
          const detail = err?.error?.message ?? 'Conflicto al enviar';
          this._toastr.warning(detail);
        } else if (err?.status === 502) {
          this._toastr.error('Error enviando el mensaje a WhatsApp');
        } else {
          this._toastr.error('No se pudo enviar el mensaje');
        }
      },
    });
  }

  // ---------- realtime events ----------

  /**
   * Mecanica visual de los eventos SSE. La notificacion (audio + Notification
   * del SO) la dispara el bus globalmente — aca solo manejamos listas, badges
   * por-conv, y el reload del detalle cuando la conv esta abierta.
   */
  private onEvent(event: InboxEvent): void {
    const summary = event.payload;
    switch (event.type) {
      case 'ESCALATED':
        this.upsertInList('pending', summary);
        break;
      case 'CLAIMED':
        this.removeFromList('pending', summary.conversation_id);
        if (summary.assigned_adviser_id === this.currentUserId) {
          // Me la asigne yo: la meto en mias en vivo y refresco el detalle
          // (canReply pasa a true, aparece textarea + Resolver).
          this.upsertInList('mine', summary);
          if (summary.conversation_id === this.selectedId) {
            this.loadDetail(summary.conversation_id);
          }
        } else if (summary.conversation_id === this.selectedId) {
          // Otro asesor la tomo primero y yo la tenia abierta: cierro el
          // detalle. Sin esto al usuario le queda un panel "fantasma" con la
          // conv en HUMAN_ACTIVE asignada a otro, sin acciones disponibles.
          this.selectedId = null;
          this.selectedThread = null;
          this.selectedMessages = [];
        }
        break;
      case 'RESOLVED':
        this.removeFromList('pending', summary.conversation_id);
        this.removeFromList('mine', summary.conversation_id);
        if (summary.conversation_id === this.selectedId) {
          this.loadDetail(summary.conversation_id);
        }
        break;
      case 'MESSAGE':
        if (summary.status === 'HUMAN_ACTIVE') {
          // Upsert en mias para que la card se mueva al top y se actualice unread_count.
          this.upsertInList('mine', summary);
          // Si la conv esta abierta: recargar thread + marcar leida si tab visible.
          if (summary.conversation_id === this.selectedId) {
            // Capturamos isAtBottom ANTES de la recarga: si el asesor estaba
            // al fondo, lo seguimos al nuevo mensaje. Si estaba leyendo arriba,
            // mantenemos su posicion y bumpeamos el badge del boton flotante.
            const wasAtBottom = this.isAtBottom;
            this._inbox.getMessages(summary.conversation_id).subscribe({
              next: (msgs) => {
                this.selectedMessages = msgs;
                if (wasAtBottom) {
                  this.scrollToBottom();
                } else {
                  this.unreadInView++;
                }
              },
            });
            if (document.visibilityState === 'visible') {
              this.markConversationRead(summary.conversation_id);
            }
          }
        }
        break;
    }
    this._cdr.markForCheck();
  }

  private upsertInList(list: 'pending' | 'mine', summary: ConversationThreadSummaryDto): void {
    const target = list === 'pending' ? this.pending : this.mine;
    const idx = target.findIndex(c => c.conversation_id === summary.conversation_id);
    if (idx >= 0) {
      // Reemplazar en sitio para refrescar timestamp, unread_count, status.
      target[idx] = summary;
      if (list === 'pending') this.pending = [...this.pending];
      else this.mine = [...this.mine];
    } else {
      if (list === 'pending') this.pending = [summary, ...this.pending];
      else this.mine = [summary, ...this.mine];
    }
  }

  private removeFromList(list: 'pending' | 'mine', id: string): void {
    if (list === 'pending') this.pending = this.pending.filter(c => c.conversation_id !== id);
    else this.mine = this.mine.filter(c => c.conversation_id !== id);
  }
}
