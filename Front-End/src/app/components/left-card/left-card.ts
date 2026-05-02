import { Component, input } from '@angular/core';
import type { components } from '../../../types/api';

type User = components['schemas']['User'];

@Component({
  selector: 'app-left-card',
  imports: [],
  template: `
    <h3 class="name">{{ user().first_name }} {{ user().last_name }}</h3>
    <p class="bio">{{ user().bio || 'Nessuna bio disponibile' }}</p>
  `,
  styles: `
  :host {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    color: #fff;
    overflow: hidden;
  }
  .name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .bio {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.85;
    overflow-y: auto;
    line-height: 1.5;
  }
  `
})
export class LeftCard {
  user = input.required<User>();
}
