import { Component, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TinderCard } from "../../components/tinder-card/tinder-card";
import { isPlatformServer } from '@angular/common';
import { ChatPanel } from '../../components/chat-panel/chat-panel';

@Component({
  selector: 'app-home',
  imports: [TinderCard, ChatPanel],
  template: `
    <div class="content">
      <app-tinder-card [hostWidth]="hostWidth()" [hostHeight]="hostHeight()"></app-tinder-card>
      
      <!-- Desktop: persistent right panel (lazy-loaded) -->
      @if (hostWidth() >= 1024) {
        @defer (on viewport) {
          <app-chat-panel [asOverlay]="false" />
        } @placeholder {
          <div class="panel-skeleton"></div>
        }
      }

      <!-- Mobile: floating button opens overlay panel (lazy-loaded) -->
      @if (hostWidth() < 1024) {
        <button class="fab" (click)="openChat()">Chat</button>
      }
      @defer (when chatOpen()) {
  <app-chat-panel [asOverlay]="true" (close)="closeChat()" />
      } @placeholder { }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
    .content { display: grid; grid-template-columns: 1fr; width: 100%; }
    @media (min-width: 1024px) { .content { grid-template-columns: 1fr 400px; } }
    .panel-skeleton { width: 100%; height: 100%; background: rgba(0,0,0,0.03); }
    .fab { position: fixed; right: 16px; bottom: 16px; border-radius: 999px; padding: 12px 18px; border: none; background: #111; color: #fff; font-weight: 600; box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
  `
})
export class Home implements OnInit, OnDestroy {
  // signals that hold current host size
  hostWidth = signal(0);
  hostHeight = signal(0);
  chatOpen = signal(false);

  // element and observer
  private el = inject(ElementRef<HTMLElement>);
  private ro?: ResizeObserver;

  ngOnInit(): void {
    // set initial size
    this.updateSize();

    // observe size changes
    this.ro = new ResizeObserver(() => this.updateSize());
    this.ro.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  private updateSize(): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.hostWidth.set(Math.round(rect.width));
    this.hostHeight.set(Math.round(rect.height));
  }

  openChat(): void { this.chatOpen.set(true); }
  closeChat(): void { this.chatOpen.set(false); }
}
