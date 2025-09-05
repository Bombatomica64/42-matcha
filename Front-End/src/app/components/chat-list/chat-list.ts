import { httpResource } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';

import type { components } from '../../../types/api';
import { environment } from '../../../environments/environment';
import { Chat } from "../chat/chat";
import { SocketService } from '../../services/socketio';

type ChatRoom = components['schemas']['ChatRoom'];

@Component({
	selector: 'app-chat-list',
	imports: [Chat],
	template: `@for (chat of chatList.value(); track $index) {
<app-chat [chatRoomId]="chat.id"></app-chat>
	}

  `,
	styles: ``
})
export class ChatList implements OnInit {
	private environment = environment;
	chatList = httpResource<ChatRoom[]>(() => { return this.environment.apiUrl + '/chat/user' });

	// Ensure a single persistent Socket.IO connection for the whole chat area
	private socket = inject(SocketService);

	ngOnInit(): void {
		this.socket.ensureConnected('/chat');
	}
}
