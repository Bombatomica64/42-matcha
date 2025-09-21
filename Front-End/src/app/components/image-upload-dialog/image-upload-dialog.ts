import { Component, inject, output, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { FileUpload } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ProgressBar } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';

import { type HttpEndpoint, type HttpMethod, HttpRequestService } from '../../services/http-request';

import type { components } from '../../../types/api';

type PostPhotoResponse = { id: string; image_url: string };
type ErrorResponse = components['schemas']['ErrorResponse'];

// Local helper types
type UploadFile = { file?: File; name?: string; size?: number; objectURL?: string }
type FileUploadSelectEvent = { files: File[] | FileList };

@Component({
  selector: 'app-image-upload-dialog',
  standalone: true,
  imports: [
    FileUpload,
    ProgressBar,
    ButtonModule,
    BadgeModule,
    ToastModule,
    CommonModule,
    DialogModule
  ],
  providers: [MessageService],
  template: `
    <p-dialog
      [(visible)]="internalVisible"
      modal="true"
      header="Upload Photo"
      [style]="{width: '500px'}"
      [draggable]="false"
      (onHide)="onDialogHide()"
    >
      <p-fileupload
        name="myfile[]"
        [customUpload]="true"
        [multiple]="false"
        accept="image/*"
        [maxFileSize]="maxFileSize()"
        (onSelect)="onSelectedFiles($event)"
        (onError)="onFileError($event)"
      >
        <ng-template #header let-files let-chooseCallback="chooseCallback" let-clearCallback="clearCallback">
          <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
            <div class="flex gap-2">
              <p-button
                (onClick)="choose($event, chooseCallback)"
                icon="pi pi-images"
                [rounded]="true"
                [outlined]="true"
              />
              <p-button
                (onClick)="uploadEvent()"
                icon="pi pi-cloud-upload"
                [rounded]="true"
                [outlined]="true"
                severity="success"
                [disabled]="!selectedFile() || isUploading()"
              />
              <p-button
                (onClick)="clearFile(clearCallback)"
                icon="pi pi-times"
                [rounded]="true"
                [outlined]="true"
                severity="danger"
                [disabled]="!selectedFile()"
              />
            </div>
            <p-progressbar
              [value]="fileSizePercent()"
              [showValue]="false"
              class="w-full md:w-20rem h-1 w-full md:ml-auto"
            >
              <span class="whitespace-nowrap">{{ formatSize(selectedFile()?.size || 0) }} / {{ formatSize(maxFileSize()) }}</span>
            </p-progressbar>
          </div>
        </ng-template>

        <ng-template #content let-files let-uploadedFiles="uploadedFiles" let-removeFileCallback="removeFileCallback">
          <div class="flex flex-col gap-8 pt-4">
            @if (selectedFile()) {
              <div>
                <h5>File selezionato</h5>
                <div class="flex justify-center">
                  <div class="p-8 rounded-border flex flex-col border border-surface items-center gap-4">
                    <div>
                      <img
                        role="presentation"
                        [alt]="selectedFile()?.name"
                        [src]="selectedFile()?.objectURL"
                        width="100"
                        height="50"
                      />
                    </div>
                    <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">
                      {{ selectedFile()?.name }}
                    </span>
                    <div>{{ formatSize(selectedFile()?.size || 0) }}</div>
                    <p-badge
                      [value]="isUploading() ? 'Caricamento...' : 'In attesa'"
                      [severity]="isUploading() ? 'info' : 'warn'"
                    />
                    @if (!isUploading()) {
                      <p-button
                        icon="pi pi-times"
                        (click)="clearFile()"
                        [outlined]="true"
                        [rounded]="true"
                        severity="danger"
                      />
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </ng-template>

        <ng-template #file></ng-template>

        <ng-template #empty>
          <div class="flex items-center justify-center flex-col">
            <i class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color"></i>
            <p class="mt-6 mb-0">Trascina un'immagine qui per caricarla.</p>
            <p class="text-sm text-muted-color mt-2">
              Dimensione massima: {{ formatSize(maxFileSize()) }}
            </p>
          </div>
        </ng-template>
      </p-fileupload>
    </p-dialog>
    <p-toast />
  `,
  styles: `
    :host {
      display: contents;
    }
  `
})
export class ImageUploadDialogComponent {
  private readonly messageService = inject(MessageService);
  private readonly http = inject(HttpRequestService);
  private readonly config = inject(PrimeNG);

  // Inputs
  visible = input<boolean>(false);
  maxFileSize = input<number>(1_000_000); // Default 1MB

  // Outputs
  visibleChange = output<boolean>();
  uploadSuccess = output<PostPhotoResponse>();
  uploadError = output<ErrorResponse>();

  // Internal visible state
  internalVisible = signal<boolean>(false);

  // Internal state
  selectedFile = signal<UploadFile | null>(null);
  isUploading = signal<boolean>(false);

  // Computed properties
  fileSizePercent = computed(() => {
    const file = this.selectedFile();
    if (!file?.size) return 0;
    return Math.min(100, Math.round((file.size / this.maxFileSize()) * 100));
  });

  constructor() {
    // Sync internal visible state with input
    effect(() => {
      this.internalVisible.set(this.visible());
    });
  }

  private readonly httpEndpoint = '/photos' as const;
  private readonly httpMethod = 'POST' as const;

  choose(event: Event, callback: () => void): void {
    callback();
  }

  onSelectedFiles(event: FileUploadSelectEvent): void {
    const filesLike = event?.files ?? [];
    const files: File[] = Array.isArray(filesLike)
      ? filesLike
      : Array.from((filesLike as FileList) ?? []);

    if (files.length === 0) {
      this.selectedFile.set(null);
      return;
    }

    // Prendi solo il primo file dato che multiple=false
    const file = files[0];

    // Controlla la dimensione del file
    if (file.size > this.maxFileSize()) {
      this.messageService.add({
        severity: 'error',
        summary: 'File troppo grande',
        detail: `Il file supera la dimensione massima di ${this.formatSize(this.maxFileSize())}`,
        life: 5000
      });
      this.selectedFile.set(null);
      return;
    }

    // Crea URL per preview
    const objectURL = URL.createObjectURL(file);

    this.selectedFile.set({
      file,
      name: file.name,
      size: file.size,
      objectURL
    });
  }

  onFileError(event: any): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Errore file',
      detail: 'Errore durante la selezione del file',
      life: 5000
    });
  }

  clearFile(clearCallback?: () => void): void {
    const currentFile = this.selectedFile();
    if (currentFile?.objectURL) {
      URL.revokeObjectURL(currentFile.objectURL);
    }
    this.selectedFile.set(null);
    if (clearCallback) {
      clearCallback();
    }
  }

  uploadEvent(): void {
    const file = this.selectedFile();
    if (!file?.file) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nessun file',
        detail: 'Seleziona un file da caricare',
        life: 3000
      });
      return;
    }

    this.isUploading.set(true);

    const formData = new FormData();
    formData.append('photo', file.file, file.file.name);
    formData.append('is_main', 'false');
    formData.append('display_order', '0');

    this.http
      .request<HttpEndpoint, 'POST', PostPhotoResponse, FormData>(
        formData,
        this.httpEndpoint as HttpEndpoint,
        this.httpMethod,
      )
      .subscribe({
        next: (response) => {
          this.isUploading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Upload completato',
            detail: 'Immagine caricata con successo',
            life: 3000
          });
          this.uploadSuccess.emit(response);
          this.closeDialog();
        },
        error: (error: ErrorResponse) => {
          this.isUploading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Upload fallito',
            detail: error?.message ?? 'Errore durante il caricamento',
            life: 5000
          });
          this.uploadError.emit(error);
        }
      });
  }

  onDialogHide(): void {
    this.clearFile();
    this.isUploading.set(false);
    this.internalVisible.set(false);
    this.visibleChange.emit(false);
  }

  private closeDialog(): void {
    this.clearFile();
    this.internalVisible.set(false);
    this.visibleChange.emit(false);
  }

  formatSize(bytes: number): string {
    const k = 1024;
    const dm = 2;
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
