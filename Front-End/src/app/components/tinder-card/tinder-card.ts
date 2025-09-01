import { Component, ElementRef, inject, input, ViewChild } from '@angular/core';
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

  dragPosition = {x: 10, y: 10};

  ngAfterViewInit() {
    const el = this.box?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    this.cardWidth = Math.round(rect.width);
    this.cardHeight = Math.round(rect.height);

    console.log(this.cardWidth, this.cardHeight);
    console.log(this.hostWidth(), this.hostHeight());
    const xInitial = (this.hostWidth() / 2) - (this.cardWidth / 2);
    const yInitial = (this.hostHeight() / 2) - (this.cardHeight / 2);
    this.dragPosition = {x: xInitial, y: yInitial};

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

    const cardCenterX = freePos.x + (this.cardWidth / 2);

    console.log('viewport:', viewportX, viewportY, 'local:', localX, localY, 'cardCenterX:', cardCenterX);

    const firstBoundary = Math.round(hostRect.width / 3);
    const secondBoundary = Math.round((hostRect.width / 3) * 2);

    if (cardCenterX < firstBoundary) {
      if (this.box) this.box.nativeElement.style.background = 'red';
    } else if (cardCenterX > secondBoundary) {
      if (this.box) this.box.nativeElement.style.background = 'blue';
    } else {
      if (this.box) this.box.nativeElement.style.background = 'white';
    }
  }

}
