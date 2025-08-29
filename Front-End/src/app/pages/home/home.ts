import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  template: `
    <div class="content"></div>
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
    .content {
      padding: 1rem;
      width: 100%;
      height: 100%;
    }
  `
})
export class Home {

}
