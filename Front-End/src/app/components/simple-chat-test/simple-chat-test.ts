import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import type { OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformServer } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import type { FormGroup } from '@angular/forms';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

import { SocketService } from '../../services/socketio';

interface ChatMessage {
	id: string;
	event: string;
	message: string;
	timestamp: Date;
	userId?: string;
	isOwnMessage?: boolean;
}

interface EventType {
	label: string;
	value: string;
}

@Component({
	selector: 'app-simple-chat-test',
	imports: [
		CommonModule,
		ReactiveFormsModule,
		CardModule,
		InputTextModule,
		ButtonModule,
		ScrollPanelModule,
		DividerModule,
		SelectModule,
		TextareaModule
	],
	template: `
    <div class="chat-container">
      <p-card header="Socket.IO Chat Test" class="chat-card">
        <!-- Connection Status -->
        <div class="connection-status">
          <span
            class="status-indicator"
            [ngClass]="{'connected': isConnected, 'disconnected': !isConnected}">
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>

        <!-- Messages Area -->
        <p-scrollPanel class="chat-messages" [style]="{'height': '400px'}">
          <div class="message-list">
						@for(msg of messages(); track msg.id){
            <div class="message-item" [ngClass]="{'own-message': msg.isOwnMessage, 'other-message': !msg.isOwnMessage}">

              <div class="message-content">
                <div class="message-header">
                  <span class="event-type">{{ msg.event }}</span>
                  <span class="message-time">{{ msg.timestamp | date:'HH:mm:ss' }}</span>
                </div>
                <div class="message-text">{{ msg.message }}</div>
              </div>
						</div>
						}
						@if(messages.length === 0){
            <div class="no-messages">
              No messages yet. Start chatting!
            </div>}
          </div>
        </p-scrollPanel>

        <p-divider></p-divider>

        <!-- Message Input -->
        <form [formGroup]="chatForm" class="message-input">
          <!-- Event Type Selection -->
          <div class="event-selection">
            <label for="eventType">Event Type:</label>
            <p-select
              id="eventType"
              formControlName="eventType"
              [options]="eventTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select event type"
              [style]="{'width': '100%'}">
            </p-select>
          </div>

          <!-- Message Content -->
          <div class="message-content-input">
            <label for="messageContent">Message Content:</label>
            <textarea
              pInputTextarea
              id="messageContent"
              formControlName="messageContent"
              (keyup.ctrl.enter)="sendMessage()"
              placeholder="Type your message content (JSON format for complex data)..."
              [disabled]="!isConnected"
              rows="3"
              [style]="{'width': '100%'}">
            </textarea>
          </div>

          <!-- Send Button -->
          <div class="send-button-container">
            <button
              pButton
              type="button"
              label="Send Event"
              icon="pi pi-send"
              (click)="sendMessage()"
              [disabled]="!chatForm.valid || !isConnected"
              class="send-button">
            </button>
          </div>
        </form>
      </p-card>
    </div>
  `,
	styles: `
    .chat-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 1rem;
    }

    .chat-card {
      width: 100%;
    }

    .connection-status {
      text-align: center;
      margin-bottom: 1rem;
    }

    .status-indicator {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.875rem;
    }

    .status-indicator.connected {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status-indicator.disconnected {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .chat-messages {
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background-color: #f8f9fa;
    }

    .message-list {
      padding: 1rem;
    }

    .message-item {
      margin-bottom: 1rem;
      display: flex;
    }

    .message-item.own-message {
      justify-content: flex-end;
    }

    .message-item.other-message {
      justify-content: flex-start;
    }

    .message-content {
      max-width: 70%;
      padding: 0.75rem;
      border-radius: 12px;
      word-wrap: break-word;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .event-type {
      font-size: 0.75rem;
      font-weight: bold;
      background-color: rgba(0, 0, 0, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
    }

    .own-message .event-type {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .other-message .event-type {
      background-color: rgba(0, 0, 0, 0.1);
      color: #333;
    }

    .own-message .message-content {
      background-color: #007bff;
      color: white;
    }

    .other-message .message-content {
      background-color: #e9ecef;
      color: #333;
    }

    .message-text {
      margin-bottom: 0.25rem;
    }

    .message-time {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .no-messages {
      text-align: center;
      color: #6c757d;
      font-style: italic;
      padding: 2rem;
    }

    .message-input {
      margin-top: 1rem;
    }

    .event-selection {
      margin-bottom: 1rem;
    }

    .event-selection label,
    .message-content-input label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: #495057;
    }

    .message-content-input {
      margin-bottom: 1rem;
    }

    .send-button-container {
      text-align: right;
    }

    .send-button {
      min-width: 120px;
    }

    .message-textbox {
      flex: 1;
    }

    .send-button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    .p-inputgroup {
      width: 100%;
    }
  `
})
export class SimpleChatTest implements OnInit, OnDestroy {
	private socketService = inject(SocketService);
	private platformId = inject(PLATFORM_ID);
	private fb = inject(FormBuilder);

	messages = signal<ChatMessage[]>([]);
	isConnected = false;

	// Reactive form
	chatForm: FormGroup;

	eventTypes: EventType[] = [
		{ label: 'Message', value: 'message' },
		{ label: 'Join Room', value: 'joinRoom' },
		{ label: 'Leave Room', value: 'leaveRoom' },
		{ label: 'User Typing', value: 'typing' },
		{ label: 'User Status', value: 'userStatus' },
		{ label: 'Custom Event', value: 'customEvent' },
		{ label: 'Ping', value: 'ping' },
		{ label: 'Error Test', value: 'errorTest' }
	];

	constructor() {
		this.chatForm = this.fb.group({
			eventType: ['message', Validators.required],
			messageContent: ['', Validators.required]
		});
	}

	ngOnInit() {
		if (isPlatformServer(this.platformId)) {
			return;
		}
		// Initialize socket with handlers
		this.socketService.initialize({
			onConnect: () => {
				this.isConnected = true;
				this.addSystemMessage('Connected to server');
				console.log('Socket ID:', this.socketService.socketId);
				console.log('Transport:', this.socketService.transport);
			},

			onDisconnect: (reason: string) => {
				this.isConnected = false;
				this.addSystemMessage(`Disconnected: ${reason}`);
			},

			onConnectError: (error: Error) => {
				this.addSystemMessage(`Connection error: ${error.message}`);
			},

			onMessage: (data: unknown) => {
				const messageData = data as { event?: string; message?: string; userId?: string };
				this.addMessage({
					id: this.generateId(),
					event: messageData.event || 'message',
					message: typeof data === 'string' ? data : (messageData.message || JSON.stringify(data)),
					timestamp: new Date(),
					userId: messageData.userId,
					isOwnMessage: false
				});
			},

			onError: (error: Error) => {
				this.addSystemMessage(`Error: ${error.message}`);
			}
		});

		// Add additional event handlers after initialization
		this.setupAdditionalHandlers();
	}

	ngOnDestroy() {
		this.socketService.disconnect();
	}

	private setupAdditionalHandlers() {
		// Pong handler
		this.socketService.on('pong', (data: unknown) => {
			const pongData = data as { event?: string; message?: string; originalData?: unknown };
			this.addMessage({
				id: this.generateId(),
				event: 'pong',
				message: `🏓 ${pongData.message || 'Pong received'}`,
				timestamp: new Date(),
				isOwnMessage: false
			});
		});

		// User typing indicators
		this.socketService.on('userTyping', (data: unknown) => {
			const typingData = data as { userName?: string; isTyping?: boolean };
			if (typingData.isTyping) {
				this.addSystemMessage(`${typingData.userName || 'Someone'} is typing...`);
			}
		});

		// User status updates
		this.socketService.on('userStatusUpdate', (data: unknown) => {
			const statusData = data as { userName?: string; status?: string };
			this.addSystemMessage(`${statusData.userName || 'User'} is now ${statusData.status || 'unknown'}`);
		});

		// Custom event responses
		this.socketService.on('customEventResponse', (data: unknown) => {
			const responseData = data as { event?: string; message?: string };
			this.addMessage({
				id: this.generateId(),
				event: 'customResponse',
				message: `✨ ${responseData.message || 'Custom event response'}`,
				timestamp: new Date(),
				isOwnMessage: false
			});
		});

		// Error handler for test errors
		this.socketService.on('error', (data: unknown) => {
			const errorData = data as { event?: string; message?: string; errorCode?: string };
			this.addMessage({
				id: this.generateId(),
				event: 'error',
				message: `❌ ${errorData.message || 'Error occurred'} (${errorData.errorCode || 'Unknown'})`,
				timestamp: new Date(),
				isOwnMessage: false
			});
		});
	}

	sendMessage() {
		if (!this.chatForm.valid || !this.socketService.isConnected) {
			return;
		}

		const formValue = this.chatForm.value;
		const messageContent = formValue.messageContent as string;
		const eventType = formValue.eventType as string;

		// Add null checks
		if (!messageContent || !eventType) {
			return;
		}

		let messageData: string | object;
		try {
			// Try to parse as JSON, otherwise use as string
			messageData = JSON.parse(messageContent.trim());
		} catch {
			messageData = messageContent.trim();
		}

		const message: ChatMessage = {
			id: this.generateId(),
			event: eventType,
			message: typeof messageData === 'string' ? messageData : JSON.stringify(messageData),
			timestamp: new Date(),
			isOwnMessage: true
		};

		this.addMessage(message);

		// Send to server using the selected event type
		if (eventType === 'message') {
			this.socketService.sendMessage(typeof messageData === 'string' ? messageData : JSON.stringify(messageData));
		} else {
			this.socketService.emit(eventType, messageData);
		}

		// Clear the message content
		this.chatForm.patchValue({ messageContent: '' });
	}

	private addMessage(message: ChatMessage) {
		this.messages.set([...this.messages(), message]);
		// Keep only last 100 messages
		if (this.messages().length > 100) {
			this.messages.set(this.messages().slice(-100));
		}
		// Auto-scroll to bottom
		setTimeout(() => this.scrollToBottom(), 100);
	}

	private addSystemMessage(text: string) {
		this.addMessage({
			id: this.generateId(),
			event: 'system',
			message: text,
			timestamp: new Date(),
			isOwnMessage: false
		});
	}

	private scrollToBottom() {
		// This will scroll the p-scrollPanel to bottom
		const scrollPanel = document.querySelector('.chat-messages .p-scrollpanel-content');
		if (scrollPanel) {
			scrollPanel.scrollTop = scrollPanel.scrollHeight;
		}
	}

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

}
