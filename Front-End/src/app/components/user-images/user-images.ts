import { Component, inject, input, PLATFORM_ID, computed, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { GalleriaModule } from 'primeng/galleria';
import { DragDropModule, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';

import { type HttpEndpoint, type HttpMethod, HttpRequestService } from '../../services/http-request';
import { GetUserProfile } from '../../services/user/get-user-profile';
import { environment } from '../../../environments/environment';
import { ImageUploadDialogComponent } from '../image-upload-dialog/image-upload-dialog';

import type { components } from '../../../types/api';

type PostPhotoResponse = { id: string; image_url: string };
type DeletePhotoResponse = unknown;
type ErrorResponse = components['schemas']['ErrorResponse'];

type Photo = components['schemas']['Photo'];

// Local helper types
type ResponsiveOption = { breakpoint: string; numVisible: number }

@Component({
  selector: 'app-user-images',
  standalone: true,
  imports: [ButtonModule, BadgeModule, ToastModule, CommonModule, GalleriaModule, DragDropModule, ImageUploadDialogComponent],
  providers: [MessageService],
  template: `
  <div class="card flex justify-center">
    <!-- Image Upload Dialog Component -->
    <app-image-upload-dialog
      [visible]="showUploadDialog"
      [maxFileSize]="1000000"
      (visibleChange)="showUploadDialog = $event"
      (uploadSuccess)="onUploadSuccess($event)"
      (uploadError)="onUploadError($event)"
    />

    <p-toast />
    @if (orderedPhotos().length > 0) {
  <div cdkDropList cdkDropListOrientation="mixed" class="example-list" (cdkDropListDropped)="onDrop($event)">
        @for (image of orderedPhotos(); track image.id; let index = $index) {
          <div class="col-span-4 example-boxes" cdkDrag>
            <div class="img-container">
              <img cdkDragHandle [src]="image.full_image_url" [alt]="image.original_filename ?? image.filename" crossorigin="use-credentials" (click)="imageClick(index)" />
              @if (image.is_main) {
                <i class="pi pi-star main-star" aria-hidden="true" title="Main photo"></i>
              }
              <p-button class="overlay-delete" aria-label="Delete photo" [rounded]="true" variant="text" [raised]="true" size="small" icon="pi pi-trash" severity="danger" (onClick)="deletePhoto(image.id)"></p-button>
            </div>
          </div>
        }
        <p-button [ngStyle]="{ display: 'flex' }" class="example-boxes" [label]="orderedPhotos().length >= 5 ? 'Limit reached' : 'Upload Photo'" icon="pi pi-upload" iconPos="top" (onClick)="showUploadDialog = true" [disabled]="orderedPhotos().length >= 5"/>
      </div>
    }
    <p-galleria
      [value]="orderedPhotos()"
      [(activeIndex)]="activeIndex"
      [responsiveOptions]="responsiveOptions"
      [containerStyle]="{ 'max-width': '850px' }"
      [numVisible]="7"
      [circular]="true"
      [fullScreen]="true"
      [showItemNavigators]="true"
      [showThumbnails]="false"
    >
      <ng-template #item let-item>
        <img [src]="item.full_image_url" [alt]="item.original_filename ?? item.filename" crossorigin="use-credentials" style="width: 100%; display: block;" />
      </ng-template>
    </p-galleria>
  </div>
  `,
  styles: `
    .example-list {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      max-width: 800px;
      gap: 15px;
      padding: 15px;
      border: solid 1px #ccc;
      min-height: 60px;
      border-radius: 4px;
      overflow: hidden;
      justify-content: center;
    }
    .example-boxes {
      border: solid 1px #ccc;
      border-radius: 4px;
      color: rgba(0, 0, 0, 0.87);
      display: inline-block;
      box-sizing: border-box;
      cursor: move;
      background: white;
      text-align: center;
      width: 100px;
      padding: 0px;
    }
    .img-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: 4px;
    }
    .example-boxes img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 4px;
    }
    .overlay-delete {
      position: absolute;
      bottom: 6px;
      right: 6px;
      z-index: 6;
      opacity: 0;
      transition: opacity 120ms ease-in-out, transform 120ms ease-in-out;
      pointer-events: none;
      --pi-button-padding: 6px;
      transform: translateY(4px);
    }
    .img-container:hover .overlay-delete {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .overlay-button {
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 5;
      opacity: 0;
      transition: opacity 120ms ease-in-out;
      pointer-events: none;
      --pi-button-padding: 6px; /* primeng small tweak if needed */
    }
    .img-container:hover .overlay-button {
      opacity: 1;
      pointer-events: auto;
    }
    .main-star {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 6;
      color: #f1c40f; /* golden yellow */
      font-size: 20px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }
    .cdk-drag-placeholder {
      opacity: 0;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `
})
export class UserImages {
  private readonly messageService = inject(MessageService);
  private readonly http = inject(HttpRequestService);
  private readonly config = inject(PrimeNG);
  private readonly platformId = inject(PLATFORM_ID);
  profileService = inject(GetUserProfile);
  displayCustom = true;

  activeIndex: number = 0;
  showUploadDialog = false;

  images = input<Photo[]>();

  // Local signal for drag-and-drop order
  orderedPhotos = signal<(Photo & { full_image_url: string })[]>([]);

  mappedPhotos = computed(() => {
    const photos = this.images() ?? [];
    // Sort photos by display_order before mapping
    const sortedPhotos = [...photos].sort((a, b) => (a.display_order) - (b.display_order));

    return sortedPhotos.map(photo => ({
      ...photo,
      full_image_url: this.buildPhotoUrl(photo.image_url || '')
    }));
  });

  constructor() {
    // Sync orderedPhotos with mappedPhotos using effect
    effect(() => {
      this.orderedPhotos.set(this.mappedPhotos());
    });
  }

  responsiveOptions: ResponsiveOption[] = [
    {
      breakpoint: '1024px',
      numVisible: 5
    },
    {
      breakpoint: '768px',
      numVisible: 3
    },
    {
      breakpoint: '560px',
      numVisible: 1
    }
  ];

  private getAssetBaseUrl(): string {
    const isBrowser = isPlatformBrowser(this.platformId);
    return isBrowser ? environment.apiUrl : environment.serverApiUrl;
  }

  buildPhotoUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    const base = this.getAssetBaseUrl();
    return encodeURI(`${base}${path}`);
  }

  imageClick(index: number) {
    this.activeIndex = index;
    this.displayCustom = true;
  }

  onUploadSuccess(response: PostPhotoResponse) {
    this.profileService.reloadProfile();
    this.showUploadDialog = false;

    // Dopo upload, imposta come main la prima immagine (se presente) dopo breve delay
    setTimeout(() => {
      const firstId = this.orderedPhotos()[0]?.id;
      if (firstId) this.setMainPhoto(firstId);
    }, 300);
  }

  onUploadError(error: ErrorResponse) {
    // L'errore è già gestito nel componente di upload
    console.error('Upload error:', error);
  }

  private readonly httpMethodDelete: HttpMethod = 'DELETE';

  deletePhoto(photoId: string) {
    const before = this.orderedPhotos();
    const optimistic = before.filter(p => p.id !== photoId);
    this.orderedPhotos.set(optimistic);

    const endpoint = `/photos/${encodeURIComponent(photoId)}` as HttpEndpoint;

    this.http
      .request(
        undefined,
        endpoint,
        this.httpMethodDelete
      )
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Photo deleted', detail: 'Foto eliminata con successo', life: 3000 });
          this.profileService.reloadProfile();
        },
        error: (error: ErrorResponse) => {
          this.orderedPhotos.set(before);
          this.messageService.add({ severity: 'error', summary: 'Delete failed', detail: error?.message ?? 'Errore', life: 5000 });
        }
      });
  }

  onDrop(event: CdkDragDrop<(Photo & { full_image_url: string })[]>) {
    const before = this.orderedPhotos();
    const optimistic = [...before];
    moveItemInArray(optimistic, event.previousIndex, event.currentIndex);
    this.orderedPhotos.set(optimistic);

    const photoIds = optimistic.map(p => p.id);
    const payload = { photoIds } as const;

    this.http
      .request<HttpEndpoint, 'PUT', unknown, typeof payload>(
        payload,
        '/photos/order' as HttpEndpoint,
        'PUT'
      )
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Ordine aggiornato', detail: 'Ordine foto salvato', life: 2000 });
          // Optionally refresh profile to reflect new order everywhere
          this.profileService.reloadProfile();
          // Dopo reorder, imposta come main la prima immagine ottimistica
          const firstIdOptimistic = optimistic[0]?.id;
          if (firstIdOptimistic) this.setMainPhoto(firstIdOptimistic);
        },
        error: (error: ErrorResponse) => {
          // rollback
          this.orderedPhotos.set(before);
          this.messageService.add({ severity: 'error', summary: 'Errore', detail: error?.message ?? 'Impossibile aggiornare ordine foto', life: 4000 });
        }
      });
  }

  setMainPhoto(photoId: string) {
    // Optimistic UI update
    const before = this.orderedPhotos();
    const updated = before.map(p => ({ ...p, is_main: p.id === photoId }));
    this.orderedPhotos.set(updated);

    this.http
      .request<HttpEndpoint, 'POST', unknown, undefined>(
        undefined,
        `/photos/${photoId}/main` as HttpEndpoint,
        'POST'
      )
      .subscribe({
        next: (_res) => {
          this.messageService.add({ severity: 'success', summary: 'Main photo', detail: 'Foto principale aggiornata', life: 2500 });
          // Ensure profile data refresh (other parts of app may depend on main photo)
          this.profileService.reloadProfile();
        },
        error: (error: ErrorResponse) => {
          // Rollback optimistic update on error
          this.orderedPhotos.set(before);
          this.messageService.add({ severity: 'error', summary: 'Errore', detail: error?.message ?? 'Impossibile impostare foto principale', life: 5000 });
        }
      });
  }
}
