import { Component, inject, input, PLATFORM_ID, computed, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { FileUpload } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { ProgressBar } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { GalleriaModule } from 'primeng/galleria';
import { DialogModule } from 'primeng/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';

import { type HttpEndpoint, type HttpMethod, HttpRequestService } from '../../services/http-request';
import { GetUserProfile } from '../../services/user/get-user-profile';
import { environment } from '../../../environments/environment';

import type { components } from '../../../types/api';

type PostPhotoResponse = { id: string; image_url: string };
type ErrorResponse = components['schemas']['ErrorResponse'];

type Photo = components['schemas']['Photo'];

// Local helper types
type ResponsiveOption = { breakpoint: string; numVisible: number }
type UploadFile = { file?: File; name?: string; size?: number; objectURL?: string }
type FileUploadSelectEvent = { files: File[] | FileList };

@Component({
  selector: 'app-user-images',
  standalone: true,
  imports: [FileUpload, ProgressBar, ButtonModule, BadgeModule, ToastModule, CommonModule, GalleriaModule, DragDropModule, DialogModule],
  providers: [MessageService],
  template: `
  <div class="card flex justify-center">
    <p-button label="Upload Photo" icon="pi pi-upload" (onClick)="showUploadDialog = true" />
    <p-dialog [(visible)]="showUploadDialog" modal="true" header="Upload Photo" [style]="{width: '500px'}">
      <p-fileupload name="myfile[]" [customUpload]="true" [multiple]="true" accept="image/*" maxFileSize="1000000" (onSelect)="onSelectedFiles($event)">
        <ng-template #header let-files let-chooseCallback="chooseCallback" let-clearCallback="clearCallback">
          <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
            <div class="flex gap-2">
              <p-button (onClick)="choose($event, chooseCallback)" icon="pi pi-images" [rounded]="true" [outlined]="true" />
              <p-button (onClick)="uploadEvent()" icon="pi pi-cloud-upload" [rounded]="true" [outlined]="true" severity="success" [disabled]="!files || files.length === 0" />
              <p-button (onClick)="clearCallback()" icon="pi pi-times" [rounded]="true" [outlined]="true" severity="danger" [disabled]="!files || files.length === 0" />
            </div>
            <p-progressbar [value]="totalSizePercent" [showValue]="false" class="w-full md:w-20rem h-1 w-full md:ml-auto">
              <span class="whitespace-nowrap">{{ totalSize }}B / 1Mb</span>
            </p-progressbar>
          </div>
        </ng-template>
        <ng-template #content let-files let-uploadedFiles="uploadedFiles" let-removeFileCallback="removeFileCallback" let-removeUploadedFileCallback="removeUploadedFileCallback">
          <div class="flex flex-col gap-8 pt-4">
            @if (files?.length > 0) {
              <div>
                <h5>Pending</h5>
                <div class="flex flex-wrap gap-4">
                  @for (file of files; track file; let i = $index) {
                    <div class="p-8 rounded-border flex flex-col border border-surface items-center gap-4">
                      <div>
                        <img role="presentation" [alt]="file.name" [src]="file.objectURL" width="100" height="50" />
                      </div>
                      <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{ file.name }}</span>
                      <div>{{ formatSize(file.size) }}</div>
                      <p-badge value="Pending" severity="warn" />
                      <p-button icon="pi pi-times" (click)="onRemoveTemplatingFile($event, file, removeFileCallback, i)" [outlined]="true" [rounded]="true" severity="danger" />
                    </div>
                  }
                </div>
              </div>
            }
            @if (uploadedFiles?.length > 0) {
              <div>
                <h5>Completed</h5>
                <div class="flex flex-wrap gap-4">
                  @for (file of uploadedFiles; track file; let i = $index) {
                    <div class="card m-0 px-12 flex flex-col border border-surface items-center gap-4">
                      <div>
                        <img role="presentation" [alt]="file.name" [src]="file.objectURL" width="100" height="50" />
                      </div>
                      <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{ file.name }}</span>
                      <div>{{ formatSize(file.size) }}</div>
                      <p-badge value="Completed" class="mt-4" severity="success" />
                      <p-button icon="pi pi-times" (onClick)="removeUploadedFileCallback(i)" [outlined]="true" [rounded]="true" severity="danger" />
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </ng-template>
        <ng-template #file></ng-template>
        <ng-template #empty>
          <div class="flex items-center justify-center flex-col">
            <i class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color"></i>
            <p class="mt-6 mb-0">Drag and drop files to here to upload.</p>
          </div>
        </ng-template>
      </p-fileupload>
    </p-dialog>
    <p-toast />
    @if (orderedPhotos().length > 0) {
      <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="grid grid-cols-12 gap-4" style="max-width: 800px;">
        @for (image of orderedPhotos(); track image.id; let index = $index) {
          <div class="col-span-4" cdkDrag>
            <img [src]="image.full_image_url" [alt]="image.original_filename ?? image.filename" crossorigin="use-credentials" style="cursor: pointer" (click)="imageClick(index)" />
            <p-button label="Set Main" icon="pi pi-star" [severity]="image.is_main ? 'success' : 'secondary'" (onClick)="setMainPhoto(image.id)" [disabled]="image.is_main" />
          </div>
        }
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
  styles: ``
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

  files: UploadFile[] = [];
  totalSize: number = 0;
  totalSizePercent: number = 0;
  private readonly maxTotalSize = 1_000_000;

  choose(_event: Event, callback: () => void): void {
    callback();
  }

  onRemoveTemplatingFile(
    event: Event,
    file: UploadFile,
    removeFileCallback: (event: Event, index: number) => void,
    index: number,
  ): void {
    removeFileCallback(event, index);
    this.totalSize -= file?.size ?? 0;
    if (this.totalSize < 0) {
      this.totalSize = 0;
    }
    this.totalSizePercent = Math.min(100, Math.round((this.totalSize / this.maxTotalSize) * 100));
  }

  onClearTemplatingUpload(clear: () => void): void {
    clear();
    this.totalSize = 0;
    this.totalSizePercent = 0;
  }

  onSelectedFiles(event: FileUploadSelectEvent): void {
    const filesLike = event?.files ?? [];
    const current: File[] = Array.isArray(filesLike)
      ? filesLike
      : Array.from((filesLike as FileList) ?? []);
    this.files = current.map((f: File) => ({ file: f, name: f.name, size: f.size }));
    this.totalSize = this.files.reduce((sum: number, f) => sum + (f?.size ?? 0), 0);
    this.totalSizePercent = Math.min(100, Math.round((this.totalSize / this.maxTotalSize) * 100));
  }

  private readonly httpEndpoint: HttpEndpoint = '/photos';
  private readonly httpMethod: HttpMethod = 'POST';

  uploadEvent(): void {
    if (!this.files || this.files.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'No files', detail: 'Nessun file da caricare', life: 3000 });
      return;
    }
    const form = new FormData();
    this.files.forEach((f) => {
      const nativeFile: File | undefined = f?.file;
      if (nativeFile instanceof File) {
        form.append('photo', nativeFile, nativeFile.name);
      }
    });
    form.append('is_main', 'false');
    form.append('display_order', '0');
    this.http
      .request<typeof this.httpEndpoint, typeof this.httpMethod, PostPhotoResponse, FormData>(
        form,
        this.httpEndpoint,
        this.httpMethod,
      )
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Upload', detail: 'Caricamento completato', life: 3000 });
          this.profileService.reloadProfile();
          this.showUploadDialog = false;
        },
        error: (error: ErrorResponse) => {
          this.messageService.add({ severity: 'error', summary: 'Upload failed', detail: error?.message ?? 'Errore', life: 5000 });
        }
      });
  }

  onDrop(event: CdkDragDrop<Photo[]>) {
    const before = this.orderedPhotos();
    const optimistic = [...before];
    const [moved] = optimistic.splice(event.previousIndex, 1);
    optimistic.splice(event.currentIndex, 0, moved);
    this.orderedPhotos.set(optimistic);

    const photoIds = optimistic.map(p => p.id);
    const payload = { photoIds } as const;

    this.http
      .request<typeof this.httpEndpoint, 'PUT', unknown, typeof payload>(
        payload,
        '/photos/order' as HttpEndpoint,
        'PUT'
      )
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Ordine aggiornato', detail: 'Ordine foto salvato', life: 2000 });
          // Optionally refresh profile to reflect new order everywhere
          this.profileService.reloadProfile();
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

  formatSize(bytes: number): string {
    const k = 1024;
    const dm = 3;
    const fallback = ['B', 'KB', 'MB', 'GB', 'TB'];
    const sizes = this.config.translation?.fileSizeTypes ?? fallback;
    if (!bytes || bytes === 0) {
      return `0 ${sizes[0]}`;
    }
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    return `${formattedSize} ${sizes[i] ?? fallback[i]}`;
  }
}
