import { Component, ElementRef, inject, input, ViewChild, effect, signal } from '@angular/core';
import {CdkDrag, CdkDragMove, CdkDragEnd} from '@angular/cdk/drag-drop';
import { HttpEndpoint, HttpMethod, HttpRequestService, PaginationQuery } from '../../services/http-request';
import { operations, components } from '../../../types/api'
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

export type DiscoverUsersQuery = operations['discoverUsers']['parameters']['query'];
type DiscoverUsersResponse = operations['discoverUsers']['responses']['200']['content']['application/json'];
type DiscoverUsersData = DiscoverUsersResponse['data'];
//cdkDragLockAxis="x"
//cdkDragBoundary=":host" non funziona con :hos

@Component({
  selector: 'app-tinder-card',
  imports: [CdkDrag, CardModule, ButtonModule],
  template: `
      <div #box class="example-box" cdkDrag [cdkDragFreeDragPosition]="dragPosition()" (cdkDragMoved)="onDragMoved($event)" (cdkDragEnded)="onDragEnded($event)">
        <div #content class="content">
          @if (users().length > 0 && currentUserIndex() < users().length) {
            <p-card [style]="{ width: '25rem', overflow: 'hidden', height: '100%' }">
              <ng-template #header>
                  <img alt="Foto profilo" class="w-full" [src]="getMainPhotoUrl()" />
              </ng-template>
              <ng-template #title>{{ users()[currentUserIndex()].first_name }} {{ users()[currentUserIndex()].last_name }}</ng-template>
              <ng-template #subtitle>Età: {{ calculateAge(users()[currentUserIndex()].birth_date) }}</ng-template>
              <p class="bio">
                {{ users()[currentUserIndex()].bio || 'Nessuna bio disponibile' }}
              </p>
              <ng-template #footer>
                  <div class="flex gap-4 mt-1">
                      <p-button label="Cancel" severity="secondary" class="w-full" [outlined]="true" styleClass="w-full" />
                      <p-button label="Save" class="w-full" styleClass="w-full" />
                  </div>
              </ng-template>
            </p-card>
          }
        </div>
      </div>
  `,
  styles: `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
  }
  .example-box {
    width: 300px;
    height: 450px;
    border: solid 1px #ccc;
    padding: 16px;
  }
  .content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 200ms ease-out, opacity 200ms ease-out;
    transform-origin: 50% 100%; /* centro X, basso Y */
    will-change: transform, opacity;
    border: solid 1px white;
  }
  .example-box:active {
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                0 8px 10px 1px rgba(0, 0, 0, 0.14),
                0 3px 14px 2px rgba(0, 0, 0, 0.12);
  }
  .bio {
    overflow: auto;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  `
})
export class TinderCard {
  private hostRef = inject(ElementRef<HTMLElement>);
  hostWidth = input.required<number>();
  hostHeight = input.required<number>();

  @ViewChild('box', { read: ElementRef }) box?: ElementRef<HTMLDivElement>;
  @ViewChild('content', { read: ElementRef }) content?: ElementRef<HTMLDivElement>;
  private cardWidth = 300;
  private cardHeight = 450;
  releasePosition = signal<"left" | "center" | "right">("center");

  users = signal<DiscoverUsersData>([]);
  currentUserIndex = signal(0);

  private cachedHostWidth = 0;
  private cachedHostHeight = 0;
  private cachedHostLeft = 0;
  private cachedHostTop = 0;
  private ro?: ResizeObserver;

  private line1?: HTMLDivElement;
  private line2?: HTMLDivElement;

  dragPosition = signal<{x: number, y: number}>({x: 10, y: 10});
  // constructor(){
  //   effect(() => {
  //     if (this.dragPosition().x > this.cachedHostWidth / 2 + 100 || this.dragPosition().y > this.cachedHostHeight / 2 -100){
  //       this.content!.nativeElement.style.transform = `rotate(15deg)`
  //       console.log('Rotating card');
  //     }
  //   });
  // }

  auth = inject(HttpRequestService);
  httpEndpoint: HttpEndpoint = "/users/discover";
  httpMethod: HttpMethod = "GET";
  queryParams: DiscoverUsersQuery = { maxDistance: 100000 };
  paginationParams: PaginationQuery = { page: 1, limit: 10, order: "asc" };
  params = { ...this.queryParams, ...this.paginationParams };


  ngOnInit(): void {
    // Inizializza la posizione di trascinamento qui se necessario
    this.auth.requestParams(
      this.params,
      this.httpEndpoint,
      this.httpMethod
    ).subscribe({
      next: (response: DiscoverUsersResponse) => {
        console.log(response);
        console.log(response.data);
        this.users.set(response.data || []);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.box?.nativeElement;
    if (!el) return;

    // leggi dimensione card una volta
    const rect = el.getBoundingClientRect();
    this.cardWidth = Math.round(rect.width);
    this.cardHeight = Math.round(rect.height);

    // misura sincrona iniziale (per non avere 0/0)
    this.updateHostSize();

    // assicurati della misura dopo il frame e poi installa l'observer
    requestAnimationFrame(() => {
      this.updateHostSize();
      this.ro = new ResizeObserver(() => this.updateHostSize());
      this.ro.observe(this.hostRef.nativeElement);
    });

    if (this.content) {
      this.content.nativeElement.style.transformOrigin = '50% 100%';
    }
  }

  ngOnDestroy() {
    this.ro?.disconnect();
  }

  private updateHostSize(): void {
    const r = this.hostRef.nativeElement.getBoundingClientRect();
    this.cachedHostWidth = Math.round(r.width);
    this.cachedHostHeight = Math.round(r.height);
    this.cachedHostLeft = Math.round(r.left);
    this.cachedHostTop = Math.round(r.top);

    // calcola qui la posizione iniziale della card ogni volta che cambia la host size
    const xInitial = (this.cachedHostWidth / 2) - (this.cardWidth / 2);
    const yInitial = (this.cachedHostHeight / 2) - (this.cardHeight / 2);
    this.dragPosition.set({ x: Math.round(xInitial), y: Math.round(yInitial) });
  }

  onDragMoved(event: CdkDragMove) {
    // posizione "libera" della card (x,y) rispetto al suo container
    const freePos = typeof event.source.getFreeDragPosition === 'function'
      ? event.source.getFreeDragPosition()
      : this.dragPosition();

    const cardRect = this.box?.nativeElement.getBoundingClientRect();
    const cardCenterX = cardRect
      ? (Math.round(cardRect.left) - this.cachedHostLeft) + (cardRect.width / 2)
      : (freePos.x + (this.cardWidth / 2));

    const firstBoundary = Math.round(this.cachedHostWidth / 3);
    const secondBoundary = Math.round((this.cachedHostWidth / 3) * 2);
    const centerBoundary = Math.round(this.cachedHostWidth / 2);

    //draw 2 red line intangibili
    if (!this.line1) {
      this.line1 = document.createElement('div');
      Object.assign(this.line1.style, {
        position: 'absolute',
        top: '0',
        bottom: '0',
        width: '2px',
        background: 'red',
        pointerEvents: 'none'
      });
      this.hostRef.nativeElement.appendChild(this.line1);
    }
    if (!this.line2) {
      this.line2 = document.createElement('div');
      Object.assign(this.line2.style, {
        position: 'absolute',
        top: '0',
        bottom: '0',
        width: '2px',
        background: 'red',
        pointerEvents: 'none'
      });
      this.hostRef.nativeElement.appendChild(this.line2);
    }
    this.line1.style.left = `${firstBoundary}px`;
    this.line2.style.left = `${secondBoundary}px`;

    if (cardCenterX < firstBoundary) {
      //if (this.box) this.box.nativeElement.style.background = 'red';
      if (this.content) {
        this.releasePosition.set("left");
        this.content.nativeElement.style.border = '1px solid red';
        this.content.nativeElement.style.transform = 'rotate(-20deg)';
      }
    } else if (cardCenterX > secondBoundary) {
      //if (this.box) this.box.nativeElement.style.background = 'blue';
      if (this.content) {
        this.releasePosition.set("right");
        this.content.nativeElement.style.border = '1px solid blue';
        this.content.nativeElement.style.transform = 'rotate(20deg)';
      }
    } else {
      //if (this.box) this.box.nativeElement.style.background = 'white';
      if (this.content) {
        this.releasePosition.set("center");
        this.content.nativeElement.style.border = '1px solid white';
        this.content.nativeElement.style.transform = 'rotate(0deg)';
      }
    }
  }

  onDragEnded(event: CdkDragEnd) {
    console.log("Drag ended, releasePosition:", this.releasePosition);
    if (this.content && this.releasePosition() == "left") {
      //animazione di caduta a sinistra
      // this.content.nativeElement.style.transition = 'transform 0.5s ease';
      this.content.nativeElement.style.transform = 'rotate(-50deg) translateX(-100%) ';
      this.content.nativeElement.style.opacity = '0';
      this.content.nativeElement.addEventListener('transitionend', () => {
        this.nextUser();
        this.resetCard();
      }, { once: true });
    } else if (this.content && this.releasePosition() == "right") {
      //animazione di caduta a destra
      // this.content.nativeElement.style.transition = 'transform 0.5s ease';
      this.content.nativeElement.style.transform = 'rotate(50deg) translateX(100%)';
      this.content.nativeElement.style.opacity = '0';
      this.content.nativeElement.addEventListener('transitionend', () => {
        this.nextUser();
        this.resetCard();
      }, { once: true });
    } else if (this.content) {
      this.resetCard();
    }
  }

  private nextUser(): void {
    if (this.currentUserIndex() < this.users().length - 1) {
      this.currentUserIndex.update(n => n + 1);
    } else {
      // Fine della lista: torna al primo (o gestisci diversamente, ad esempio ricarica)
      this.currentUserIndex.set(0);
      console.log("Fine utenti, ricomincio dal primo.");
    }
  }

  // Metodo per resettare la card alla posizione iniziale
  private resetCard(): void {
    if (this.content) {
      this.content.nativeElement.style.transform = 'rotate(0deg) translateX(0%)';
      this.content.nativeElement.style.opacity = '1';
      this.content.nativeElement.style.border = '1px solid white';
    }
    // Ricalcola la posizione centrale (chiama updateHostSize per aggiornare dragPosition)
    this.updateHostSize();
  }

  // Metodo per ottenere l'URL della foto principale
  getMainPhotoUrl(): string {
    const user = this.users()[this.currentUserIndex()];
    const mainPhoto = user.photos?.find(photo => photo.is_main);
    return mainPhoto?.image_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNlHxpViduYZdKNiOmJRnkvFnKf88RcG-Edg&s';  // Placeholder se non c'è foto
  }

  // Metodo per calcolare l'età (opzionale, basato su birth_date)
  calculateAge(birthDate?: string): number | string {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

}
