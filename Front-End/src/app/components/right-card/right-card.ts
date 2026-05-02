import { Component, computed, input } from '@angular/core';
import type { components } from '../../../types/api';

type User = components['schemas']['User'];

const MOCK_PHOTOS = [
  "https://randomuser.me/api/portraits/women/10.jpg",
  "https://randomuser.me/api/portraits/women/11.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
  "https://randomuser.me/api/portraits/women/13.jpg",
  "https://randomuser.me/api/portraits/women/14.jpg",
];

@Component({
  selector: 'app-right-card',
  imports: [],
  template: `
    <div class="scroll-wrapper">
      <div class="fade-top"></div>
      <div class="photo-list">
        @for (url of photos(); track url) {
          <img [src]="url" alt="foto" />
        }
      </div>
      <div class="fade-bottom"></div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }
    .scroll-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 4px;
      box-sizing: border-box;
      overflow: hidden;
    }
    .fade-top,
    .fade-bottom {
      position: absolute;
      left: 4px;
      right: 4px;
      height: 48px;
      z-index: 2;
      pointer-events: none;
    }
    .fade-top {
      top: 4px;
      background: linear-gradient(180deg, rgb(51, 51, 51) 0%, rgba(15, 133, 250, 0) 8%);
    }
    .fade-bottom {
      bottom: 4px;
      background: linear-gradient(0deg, rgb(51, 51, 51) 0%, rgba(15, 133, 250, 0) 8%);
    }
    .photo-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      height: 100%;
      scrollbar-width: none;
    }
    .photo-list::-webkit-scrollbar {
      display: none;
    }
    img {
      width: 100%;
      object-fit: cover;
      border-radius: 6px;
      flex-shrink: 0;
    }
  `
})
export class RightCard {
  user = input<User>();

  photos = computed(() => {
    const real = this.user()?.photos?.map(p => p.image_url).filter(Boolean) as string[];
    return real?.length ? real : MOCK_PHOTOS;
  });
}
