import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-debug-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-overlay" *ngIf="messages.length > 0">
      <div class="debug-header">
        <span>Debug Info</span>
        <button (click)="clear()" class="btn-clear">Limpiar</button>
      </div>
      <div class="debug-messages">
        <div *ngFor="let msg of messages" [class]="'debug-msg ' + msg.type">
          <span class="time">{{ msg.time }}</span>
          <span class="text">{{ msg.text }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .debug-overlay {
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      max-height: 300px;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #4a9eff;
      border-radius: 8px;
      z-index: 9999;
      overflow: auto;
      font-size: 11px;
      font-family: monospace;
    }
    .debug-header {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: #1a1a1a;
      border-bottom: 1px solid #4a9eff;
      color: #4a9eff;
      font-weight: bold;
    }
    .btn-clear {
      background: #ef5350;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
    }
    .debug-messages {
      padding: 8px;
      max-height: 250px;
      overflow-y: auto;
    }
    .debug-msg {
      padding: 4px;
      margin: 2px 0;
      border-radius: 4px;
    }
    .debug-msg.info {
      background: rgba(74, 158, 255, 0.2);
      color: #4a9eff;
    }
    .debug-msg.error {
      background: rgba(239, 83, 80, 0.2);
      color: #ef5350;
    }
    .debug-msg.success {
      background: rgba(38, 166, 154, 0.2);
      color: #26a69a;
    }
    .time {
      opacity: 0.7;
      margin-right: 8px;
    }
  `]
})
export class DebugOverlayComponent {
  messages: Array<{time: string, text: string, type: string}> = [];

  addMessage(text: string, type: 'info' | 'error' | 'success' = 'info') {
    const time = new Date().toLocaleTimeString();
    this.messages.push({ time, text, type });

    // Mantener solo los últimos 50 mensajes
    if (this.messages.length > 50) {
      this.messages.shift();
    }
  }

  clear() {
    this.messages = [];
  }
}
