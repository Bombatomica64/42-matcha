import { Component, ElementRef, inject, type OnDestroy, type OnInit, signal } from '@angular/core';
import { TinderCard } from "../../components/tinder-card/tinder-card";


@Component({
  selector: 'app-home',
  imports: [TinderCard],
  template: `
      <app-tinder-card [hostWidth]="hostWidth()" [hostHeight]="hostHeight()"></app-tinder-card>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
  `
})
export class Home implements OnInit, OnDestroy {
  // signals that hold current host size
  hostWidth = signal(0);
  hostHeight = signal(0);

  // element and observer
  private el = inject(ElementRef<HTMLElement>);
  private ro?: ResizeObserver;

  ngOnInit(): void {
    // set initial size
    this.updateSize();

    // observe size changes
    this.ro = new ResizeObserver(() => this.updateSize());
    this.ro.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  private updateSize(): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.hostWidth.set(Math.round(rect.width));
    this.hostHeight.set(Math.round(rect.height));
  }
}
