import { Component, ElementRef, inject, input, ViewChild, AfterViewInit, OnDestroy  } from '@angular/core';
import {CdkDrag, CdkDragMove} from '@angular/cdk/drag-drop';

//cdkDragLockAxis="x"
//cdkDragBoundary=":host" non funziona con :hos

@Component({
  selector: 'app-tinder-card',
  imports: [CdkDrag],
  template: `
    <div #box class="example-box" cdkDrag [cdkDragFreeDragPosition]="dragPosition" (cdkDragMoved)="onDragMoved($event)">
      <div #content class="content">
        Drag me around
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
    width: 200px;
    height: 200px;
    border: solid 1px #ccc;
    padding: 16px;
  }
  .content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 120ms ease;
    transform-origin: 50% 100%; /* centro X, basso Y */
    border: solid 1px #dd0f0fff;
  }
  .example-box:active {
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                0 8px 10px 1px rgba(0, 0, 0, 0.14),
                0 3px 14px 2px rgba(0, 0, 0, 0.12);
  }
  `
})
export class TinderCard {
  private hostRef = inject(ElementRef<HTMLElement>);
  hostWidth = input.required<number>();
  hostHeight = input.required<number>();

  @ViewChild('box', { read: ElementRef }) box?: ElementRef<HTMLDivElement>;
  @ViewChild('content', { read: ElementRef }) content?: ElementRef<HTMLDivElement>;
  private cardWidth = 200;
  private cardHeight = 200;

  private cachedHostWidth = 0;
  private cachedHostHeight = 0;
  private cachedHostLeft = 0;
  private cachedHostTop = 0;
  private ro?: ResizeObserver;

  private line1?: HTMLDivElement;
  private line2?: HTMLDivElement;

  dragPosition = {x: 10, y: 10};

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
    this.dragPosition = { x: Math.round(xInitial), y: Math.round(yInitial) };
  }

  onDragMoved(event: CdkDragMove) {
    // pointerPosition è in coordinate viewport
    const viewportX = event.pointerPosition.x;
    const viewportY = event.pointerPosition.y;

    // bounding rect dell'host per convertire a coordinate locali
    const localX = Math.round(viewportX - this.cachedHostLeft);
    const localY = Math.round(viewportY - this.cachedHostTop);

    // posizione "libera" della card (x,y) rispetto al suo container
    const freePos = typeof event.source.getFreeDragPosition === 'function'
      ? event.source.getFreeDragPosition()
      : this.dragPosition;

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
      if (this.content) this.content.nativeElement.style.transform = 'rotate(-20deg)';
    } else if (cardCenterX > secondBoundary) {
      //if (this.box) this.box.nativeElement.style.background = 'blue';
      if (this.content) this.content.nativeElement.style.transform = 'rotate(20deg)';
    } else {
      //if (this.box) this.box.nativeElement.style.background = 'white';
      if (this.content) this.content.nativeElement.style.transform = 'rotate(0deg)';
    }
  }



}
