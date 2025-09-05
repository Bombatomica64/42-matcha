import { Component, inject, input } from '@angular/core';
import type { NewChatMessagePayload } from '../../../types/api';
import { VgApiService, VgCoreModule, VgMediaDirective } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';



@Component({
	selector: 'app-chat-message',
	standalone: true,
	imports: [VgCoreModule, VgControlsModule, VgOverlayPlayModule, VgBufferingModule],
	templateUrl: './chat-message.html',
	styles: ``
})
export class ChatMessage {
	content = input.required<NewChatMessagePayload>();
	options = input<{ isOwnMessage: boolean }>({ isOwnMessage: false });
	private media = inject(VgApiService);

	handlePlayerReady(event: VgApiService) {
		this.media = event;
	}
}
