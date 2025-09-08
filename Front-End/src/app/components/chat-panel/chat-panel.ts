import { Component, input, output } from '@angular/core';
import { ChatList } from '../chat-list/chat-list';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [ChatList],
  template: `
    <div class="panel" [class.overlay]="asOverlay()">
      @if (asOverlay()) {
        <div class="panel-header">
          <button type="button" class="close-btn" (click)="close.emit()">✕</button>
          <h3>Chat</h3>
        </div>
      }
      <div class="panel-body">
        <app-chat-list />
      </div>
    </div>
    @if (asOverlay()) {
      <div class="backdrop" (click)="close.emit()"></div>
    }
  `,
  styles: `
    :host { display: contents; }
    .panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      max-width: 400px;
      border-left: 1px solid rgba(0,0,0,0.1);
      background: var(--surface, #fff);
      z-index: 1001;
    }
    .panel.overlay {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: min(92vw, 420px);
      box-shadow: -8px 0 16px rgba(0,0,0,0.15);
      background: var(--surface, #fff);
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .close-btn {
      margin-right: auto;
      border: none;
      background: transparent;
      font-size: 18px;
      cursor: pointer;
    }
    .panel-body { flex: 1; min-height: 0; overflow: auto; }
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      z-index: 1000;
    }
  `
})
export class ChatPanel {
  asOverlay = input<boolean>(false);
  close = output<void>();
}
