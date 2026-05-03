import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export type SessionTimeoutResult = 'continue' | 'logout' | 'timeout';

interface SessionTimeoutData {
  /** Milisegundos restantes al abrir el modal (el layout pasa inactivityWarningMs). */
  remainingMs: number;
}

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-timeout-modal.component.html',
  styleUrl: './session-timeout-modal.component.scss',
})
export class SessionTimeoutModalComponent implements OnInit, OnDestroy {

  countdownDisplay = '0:00';

  private remainingMs: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private _dialogRef: MatDialogRef<SessionTimeoutModalComponent, SessionTimeoutResult>,
    @Inject(MAT_DIALOG_DATA) data: SessionTimeoutData,
  ) {
    this.remainingMs = data.remainingMs;
  }

  ngOnInit(): void {
    this.updateDisplay();
    // Tick cada segundo. No necesitamos mayor precisión — el countdown
    // sólo se usa para feedback visual; el timer REAL vive en
    // InactivityService y es el que dispara el logout definitivo.
    this.intervalId = setInterval(() => {
      this.remainingMs -= 1000;
      if (this.remainingMs <= 0) {
        this.remainingMs = 0;
        this.updateDisplay();
        this._dialogRef.close('timeout');
        return;
      }
      this.updateDisplay();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onContinue(): void { this._dialogRef.close('continue'); }
  onLogout(): void   { this._dialogRef.close('logout'); }

  private updateDisplay(): void {
    const totalSeconds = Math.max(0, Math.floor(this.remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.countdownDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
