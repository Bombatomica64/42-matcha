import { Component, ElementRef, inject, input, ViewChild, AfterViewInit, OnDestroy  } from '@angular/core';
import {CdkDrag, CdkDragMove} from '@angular/cdk/drag-drop';

//cdkDragLockAxis="x"
//cdkDragBoundary=":host" non funziona con :hos

@Component({
  selector: 'app-tinder-card',
  imports: [CdkDrag],
  template: `
    <div #box class="example-box" cdkDrag [cdkDragFreeDragPosition]="dragPosition" (cdkDragMoved)="onDragMoved($event)">
      Drag me around
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
    color: rgba(0, 0, 0, 0.87);
    cursor: move;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: #fff;
    border-radius: 4px;
    position: relative;
    z-index: 1;
    transition: box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
                0 2px 2px 0 rgba(0, 0, 0, 0.14),
                0 1px 5px 0 rgba(0, 0, 0, 0.12);
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
  private cardWidth = 200;
  private cardHeight = 200;

  private cachedHostWidth = 0;
  private cachedHostHeight = 0;
  private cachedHostLeft = 0;
  private cachedHostTop = 0;
  private ro?: ResizeObserver;

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

    // log per debug
    console.log('updateHostSize fired, host size:', this.cachedHostWidth, this.cachedHostHeight);
    console.log('card', this.cardWidth, this.cardHeight, 'dragPosition', this.dragPosition);
  }

  onDragMoved(event: CdkDragMove) {
    // pointerPosition è in coordinate viewport
    const viewportX = event.pointerPosition.x;
    const viewportY = event.pointerPosition.y;

    // bounding rect dell'host per convertire a coordinate locali
    const hostRect = this.hostRef.nativeElement.getBoundingClientRect();
    const localX = Math.round(viewportX - hostRect.left);
    const localY = Math.round(viewportY - hostRect.top);

    // posizione "libera" della card (x,y) rispetto al suo container
    const freePos = typeof event.source.getFreeDragPosition === 'function'
      ? event.source.getFreeDragPosition()
      : this.dragPosition;

    const cardRect = this.box?.nativeElement.getBoundingClientRect();
    const cardCenterX = cardRect
      ? (Math.round(cardRect.left) - this.cachedHostLeft) + (cardRect.width / 2)
      : (freePos.x + (this.cardWidth / 2));

    console.log('viewport:', viewportX, viewportY, 'local:', localX, localY, 'cardCenterX:', cardCenterX);

    console.log('full-width:', this.cachedHostWidth);
    const firstBoundary = Math.round(this.cachedHostWidth / 3);
    const secondBoundary = Math.round((this.cachedHostWidth / 3) * 2);
    console.log('boundaries:', firstBoundary, secondBoundary);
    //draw 2 red line intangibili
    const line1 = document.createElement('div');
    line1.style.position = 'absolute';
    line1.style.left = `${firstBoundary}px`;
    line1.style.top = '0';
    line1.style.bottom = '0';
    line1.style.width = '2px';
    line1.style.background = 'red';
    this.hostRef.nativeElement.appendChild(line1);

    const line2 = document.createElement('div');
    line2.style.position = 'absolute';
    line2.style.left = `${secondBoundary}px`;
    line2.style.top = '0';
    line2.style.bottom = '0';
    line2.style.width = '2px';
    line2.style.background = 'red';
    this.hostRef.nativeElement.appendChild(line2);

    if (cardCenterX < firstBoundary) {
      if (this.box) this.box.nativeElement.style.background = 'red';
    } else if (cardCenterX > secondBoundary) {
      if (this.box) this.box.nativeElement.style.background = 'blue';
    } else {
      if (this.box) this.box.nativeElement.style.background = 'white';
    }
  }

}
