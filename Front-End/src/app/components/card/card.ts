import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  imports: [],
  template: `
    <p>
      card works!
    </p>
  `,
  styles: ``
})
export class Card {
  state = input.required<'left'|'right'|'center'>();

}



// // ...existing code...
// @Component({
//   // ...existing code...
//   template: `
//     <div #box class="example-box" cdkDrag [cdkDragFreeDragPosition]="dragPosition"
//          (cdkDragMoved)="onDragMoved($event)" (cdkDragEnded)="onDragEnded($event)">
//       <!-- usa il componente presentazionale -->
//       <app-card [state]="visualState" #card>
//         <!-- qui metti il contenuto della tessera (foto, nome...) -->
//         <div class="card-inner">Drag me around</div>
//       </app-card>
//     </div>
//   `,
//   // ...existing code...
// })
// export class TinderCard {
//   // ...existing code...
//   visualState: 'left'|'right'|'center' = 'center';

//   onDragMoved(event: CdkDragMove) {
//     // calcola releasePosition come fai ora e poi:
//     this.releasePosition = computed; // left/right/center
//     this.visualState = this.releasePosition; // aggiorna il child via binding
//   }

//   onDragEnded(event: CdkDragEnd) {
//     if (this.releasePosition === 'left' || this.releasePosition === 'right') {
//       // trigger fall: puoi usare un altro flag per far partire l'animazione di "caduta"
//       const cardEl = /* get app-card root via ViewChild if you need to add 'fall-*' class */;
//       // oppure aggiungi uno state 'fall-left' / 'fall-right' al child component
//       // emetti evento al parent dopo timeout
//     } else {
//       this.visualState = 'center';
//     }
//   }
// }
