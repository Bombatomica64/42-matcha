import { Component, inject, input } from "@angular/core";
import { NgClass, CommonModule } from "@angular/common";
import { VgBufferingModule } from "@videogular/ngx-videogular/buffering";
import { VgControlsModule } from "@videogular/ngx-videogular/controls";
import {
  VgApiService,
  VgCoreModule,
} from "@videogular/ngx-videogular/core";
import { VgOverlayPlayModule } from "@videogular/ngx-videogular/overlay-play";
import type { NewChatMessagePayload } from "../../../types/api";

@Component({
  selector: "app-chat-message",
  standalone: true,
  imports: [
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    NgClass,
    CommonModule,
  ],
  templateUrl: "./chat-message.html",
  styles: `
:host { display: block; }
.message-row { display: flex; width: 100%; padding: 0 .25rem .75rem; }
:host-context(.chat-scroller .p-virtualscroller-content > app-chat-message:last-child) .message-row { padding-bottom: 0; }
.message-card {
	max-width: 70%;
	padding: .6rem .9rem;
	border-radius: 1.1rem;
	background: var(--p-surface-200, #2f2f2f);
	color: var(--p-text-color, #fff);
	line-height: 1.3;
	font-size: .95rem;
		box-shadow: 0 2px 4px -1px rgba(0,0,0,.4);
	display: flex;
	flex-direction: column;
	gap: .5rem;
	overflow: hidden;
}
.message-card.own {
	margin-left: auto; /* push to right */
	background: var(--p-primary-color, #6366f1);
	color: var(--p-primary-contrast-color, #fff);
	border-bottom-right-radius: .3rem;
	border-bottom-left-radius: 1.1rem;
}
.message-card.other {
	margin-right: auto; /* keep left */
	background: var(--p-surface-300, #404040);
	border-bottom-left-radius: .3rem;
	border-bottom-right-radius: 1.1rem;
}
.media-wrapper img, .media-wrapper video, .media-wrapper audio { max-width: 100%; border-radius: .6rem; }
.text-content p { margin: 0; white-space: pre-wrap; word-break: break-word; }
`,
})
export class ChatMessage {
  content = input.required<NewChatMessagePayload>();
  options = input.required<{ isOwnMessage: boolean }>();
  // Keep reference if future advanced controls needed
  // eslint-disable-next-line @typescript-eslint/no-unused-private-class-members
  private media = inject(VgApiService);

  ngAfterViewInit() {
    // Access media to prevent unused lint issue
    void this.media;
  }

  handlePlayerReady(event: VgApiService) {
    this.media = event;
  }
}
