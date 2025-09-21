import {
	CdkDrag,
	type CdkDragEnd,
	type CdkDragMove,
} from "@angular/cdk/drag-drop";
import {
	Component,
	ElementRef,
	inject,
	input,
	signal,
	ViewChild,
} from "@angular/core";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CommonModule } from "@angular/common";
import type { operations } from "../../../types/api";
import {
	type HttpEndpoint,
	type HttpMethod,
	HttpRequestService,
	type PaginationQuery,
} from "../../services/http-request";
import { Card } from "../card/card";

export type DiscoverUsersQuery =
	operations["discoverUsers"]["parameters"]["query"];
type DiscoverUsersResponse =
	operations["discoverUsers"]["responses"]["200"]["content"]["application/json"];
type DiscoverUsersData = DiscoverUsersResponse["data"];

@Component({
	selector: "app-tinder-card",
	imports: [CdkDrag, CardModule, ButtonModule, Card, CommonModule],
	animations: [
		trigger('slideFromRight', [
			transition(':enter', [
				style({ left: '-10%' }),
				animate('300ms ease-in-out', style({ left: '-70%' }))
			]),
			transition(':leave', [
				animate('300ms ease-in-out', style({ left: '10%' }))
			])
		]),
		trigger('slideFromLeft', [
			transition(':enter', [
				style({ left: '10%' }),
				animate('300ms ease-in-out', style({ left: '100%' }))
			]),
			transition(':leave', [
				animate('300ms ease-in-out', style({ left: '10%' }))
			])
		]),
	],
	template: `
      <div #box class="example-box" cdkDrag [cdkDragFreeDragPosition]="dragPosition()" (cdkDragMoved)="onDragMoved($event)" (cdkDragEnded)="onDragEnded($event)">
        <div #content class="content">
          @if (users().length > 0 && currentUserIndex() < users().length) {
            @if (!isDragging() && !sidesHidden())
              {
                <div class="left" @slideFromRight></div>
                <div class="right" @slideFromLeft></div>
              }
            <app-card [user]="users()[currentUserIndex()]" />
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
  .left {
    position: absolute;
    top: 5%;
    left: -70%;
    width: 70%;
    height: 90%;
    background: #ffffffff;
    z-index: 1;
  }
  .right {
    position: absolute;
    top: 5%;
    left: 100%;
    width: 70%;
    height: 90%;
    background: #ffffffff;
    z-index: 1;
  }
  .example-box {
    width: 90%;
    height: 90%;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .content {
    width: 100%;
    height: 100%;
    max-width: 22rem;
    max-height: 38rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 200ms ease-out;
    transform-origin: 50% 100%; /* centro X, basso Y */
    will-change: transform, opacity;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    border: 1px solid #242424ff;
    border-radius: 8px;
    z-index: 10;
  }
  .content::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 20;
    border-radius: 6px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.35);
  }
  .bio {
    overflow: auto;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  `,
})
export class TinderCard {
  private hostRef = inject(ElementRef<HTMLElement>);
	hostWidth = input.required<number>();
	hostHeight = input.required<number>();
  private rafId = 0;
  // durata animazione di rilascio (ms)
  private releaseAnimMs = 500;

	@ViewChild("box", { read: ElementRef }) box?: ElementRef<HTMLDivElement>;
	@ViewChild("content", { read: ElementRef })
	content?: ElementRef<HTMLDivElement>;
	// inizialmente 0: misuriamo la dimensione reale di `.example-box` a runtime
	private cardWidth = 0;
	private cardHeight = 0;
	releasePosition = signal<"left" | "center" | "right">("center");

	users = signal<DiscoverUsersData>([]);
	currentUserIndex = signal(0);
	isDragging = signal(false);
  sidesHidden = signal(false);

	private cachedHostWidth = 0;
	private cachedHostHeight = 0;
	private cachedHostLeft = 0;
	// private cachedHostTop = 0;
	private ro?: ResizeObserver;

	private line1?: HTMLDivElement;
	private line2?: HTMLDivElement;
  private line3?: HTMLDivElement;

	dragPosition = signal<{ x: number; y: number }>({ x: 10, y: 10 });

	auth = inject(HttpRequestService);
	httpEndpoint: HttpEndpoint = "/users/discover";
	httpMethod: HttpMethod = "GET";
	queryParams: DiscoverUsersQuery = { maxDistance: 100000 };
	paginationParams: PaginationQuery = { page: 1, limit: 10, order: "asc" };
	params = { ...this.queryParams, ...this.paginationParams };

	ngOnInit(): void {
		// Inizializza la posizione di trascinamento qui se necessario
		this.auth
			.requestParams<
				typeof this.httpEndpoint,
				typeof this.httpMethod,
				typeof this.params,
				DiscoverUsersResponse
			>(this.params, this.httpEndpoint, this.httpMethod)
			.subscribe({
				next: (response) => {
					console.log(response);
					this.users.set(response.data || []);
				},
				error: (error) => {
					console.error(error);
				},
			});
	}

	ngAfterViewInit(): void {
		const el = this.box?.nativeElement;
		if (!el) return;

		// leggi dimensione card una volta (misura iniziale dalla .example-box)
		this.measureCardSize();

		// misura sincrona iniziale (per non avere 0/0)
		this.updateHostSize();

		// assicurati della misura dopo il frame e poi installa l'observer
		requestAnimationFrame(() => {
			this.updateHostSize();
			// Osserva sia l'host che la box: quando cambiano dimensione rimisuriamo la card
			this.ro = new ResizeObserver(() => {
				this.measureCardSize();
				this.updateHostSize();
			});
			this.ro.observe(this.hostRef.nativeElement);
			if (this.box?.nativeElement) this.ro.observe(this.box.nativeElement);
		});

		// ascolta resize della finestra come fallback
		window.addEventListener("resize", this.onWindowResize);

		if (this.content) {
			this.content.nativeElement.style.transformOrigin = "50% 100%";
		}
	}

	ngOnDestroy() {
		this.ro?.disconnect();
		window.removeEventListener("resize", this.onWindowResize);
	}

	// Handler per evento window.resize
	private onWindowResize = (): void => {
		this.measureCardSize();
		this.updateHostSize();
	};

	private updateHostSize(): void {
		const r = this.hostRef.nativeElement.getBoundingClientRect();
		this.cachedHostWidth = Math.round(r.width);
		this.cachedHostHeight = Math.round(r.height);
		this.cachedHostLeft = Math.round(r.left);
		// this.cachedHostTop = Math.round(r.top);

		// assicura di avere le dimensioni della card (misura se necessario)
		if (!this.cardWidth || !this.cardHeight) {
			this.measureCardSize();
		}

		// calcola qui la posizione iniziale della card ogni volta che cambia la host size
		const xInitial = this.cachedHostWidth / 2 - this.cardWidth / 2;
		const yInitial = this.cachedHostHeight / 2 - this.cardHeight / 2;
		this.dragPosition.set({ x: Math.round(xInitial), y: Math.round(yInitial) });
	}

	// Misura la dimensione in pixel della .example-box (this.box) e applica fallback
	private measureCardSize(): void {
		const el = this.box?.nativeElement;
		if (!el) {
			// fallback ragionevole: usa valori minimi
			this.cardWidth = this.cardWidth || 300;
			this.cardHeight = this.cardHeight || 400;
			return;
		}
		const rect = el.getBoundingClientRect();
		this.cardWidth = Math.max(1, Math.round(rect.width));
		this.cardHeight = Math.max(1, Math.round(rect.height));
	}

	onDragMoved(event: CdkDragMove) {
		// Imposta che stiamo trascinando
		this.isDragging.set(true);
    this.sidesHidden.set(true);

		// posizione "libera" della card (x,y) rispetto al suo container
		const freePos =
			typeof event.source.getFreeDragPosition === "function"
				? event.source.getFreeDragPosition()
				: this.dragPosition();

		const cardRect = this.box?.nativeElement.getBoundingClientRect();
		const cardCenterX = cardRect
			? Math.round(cardRect.left) - this.cachedHostLeft + cardRect.width / 2
			: freePos.x + this.cardWidth / 2;

		const firstBoundary = Math.round(this.cachedHostWidth / 3);
		const secondBoundary = Math.round((this.cachedHostWidth / 3) * 2);
    const centerBoundary = Math.round(this.cachedHostWidth / 2);

    // const centerBoundary = Math.round(this.cachedHostWidth / 2);

		//draw 2 red line intangibili
		if (!this.line1) {
			this.line1 = document.createElement("div");
			Object.assign(this.line1.style, {
				position: "absolute",
				top: "0",
				bottom: "0",
				width: "2px",
				background: "red",
				pointerEvents: "none",
			});
			this.hostRef.nativeElement.appendChild(this.line1);
		}
		if (!this.line2) {
			this.line2 = document.createElement("div");
			Object.assign(this.line2.style, {
				position: "absolute",
				top: "0",
				bottom: "0",
				width: "2px",
				background: "red",
				pointerEvents: "none",
			});
			this.hostRef.nativeElement.appendChild(this.line2);
		}
    if (!this.line3) {
      this.line3 = document.createElement("div");
      Object.assign(this.line3.style, {
        position: "absolute",
        top: "0",
        bottom: "0",
        width: "2px",
        background: "purple",
        pointerEvents: "none",
      });
      this.hostRef.nativeElement.appendChild(this.line3);
    }
		this.line1.style.left = `${firstBoundary}px`;
		this.line2.style.left = `${secondBoundary}px`;
    this.line3.style.left = `${centerBoundary}px`;

		// Calcola la distanza dal centro come percentuale (-1 a 1)
		const distanceFromCenter = (cardCenterX - centerBoundary) / (centerBoundary);

		// Limita la distanza tra -1 e 1 per evitare rotazioni eccessive
		const clampedDistance = Math.max(-1, Math.min(1, distanceFromCenter));

		// Calcola la rotazione proporzionale (max 30 gradi)
		const maxRotation = 30;
		const rotation = clampedDistance * maxRotation;

   if (this.content) {
     // rimuovi transizione sul transform mentre trascini (evita "lag")
     this.content.nativeElement.style.transition = "none";
     // batch DOM writes con requestAnimationFrame
     if (this.rafId) cancelAnimationFrame(this.rafId);
     this.rafId = requestAnimationFrame(() => {
       // Applica la rotazione proporzionale (immediata)
       this.content!.nativeElement.style.transform = `rotate(${rotation}deg)`;
       // Cambia il colore del bordo in base alla posizione per i boundary
       if (cardCenterX < firstBoundary) {
         this.releasePosition.set("left");
         this.content!.nativeElement.style.border = "1px solid red";
       } else if (cardCenterX > secondBoundary) {
         this.releasePosition.set("right");
         this.content!.nativeElement.style.border = "1px solid blue";
       } else {
         this.releasePosition.set("center");
         this.content!.nativeElement.style.border = "1px solid #3b3b3bff";
       }
     });
   }}

	onDragEnded(_event: CdkDragEnd) {
		// Resetta lo stato di trascinamento
		this.isDragging.set(false);

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

		console.log("Drag ended, releasePosition:", this.releasePosition);
		if (this.content && this.releasePosition() === "left") {
			//animazione di caduta a sinistra
			// this.content.nativeElement.style.transition = 'transform 0.5s ease';
      this.content.nativeElement.style.transition = `transform ${this.releaseAnimMs}ms ease, opacity ${this.releaseAnimMs}ms ease`;
      // forza repaint prima di cambiare (opzionale) per essere sicuri che la transition sia applicata
      void this.content.nativeElement.offsetWidth;
      this.content.nativeElement.style.transform = "rotate(-50deg) translateX(-100%)";
      this.content.nativeElement.style.opacity = "0";
			this.content.nativeElement.addEventListener(
				"transitionend",
				() => {
					this.nextUser();
					this.resetCard();
				},
				{ once: true },
			);
		} else if (this.content && this.releasePosition() === "right") {
			//animazione di caduta a destra
			// this.content.nativeElement.style.transition = 'transform 0.5s ease';
      this.content.nativeElement.style.transition = `transform ${this.releaseAnimMs}ms ease, opacity ${this.releaseAnimMs}ms ease`;
      void this.content.nativeElement.offsetWidth;
      this.content.nativeElement.style.transform = "rotate(50deg) translateX(100%)";
      this.content.nativeElement.style.opacity = "0";
			this.content.nativeElement.addEventListener(
				"transitionend",
				() => {
					this.nextUser();
					this.resetCard();
				},
				{ once: true },
			);
		} else if (this.content) {
			this.resetCard();
		}
	}

	private nextUser(): void {
		if (this.currentUserIndex() < this.users().length - 1) {
			this.currentUserIndex.update((n) => n + 1);
		} else {
			// Fine della lista: torna al primo (o gestisci diversamente, ad esempio ricarica)
			this.currentUserIndex.set(0);
			console.log("Fine utenti, ricomincio dal primo.");
		}
	}

	// Metodo per resettare la card alla posizione iniziale
	private resetCard(): void {
		// Assicuriamoci che non stiamo più trascinando
		//this.isDragging.set(false);

    if (this.content) {
      // abilita transizione per il reset visivo
      this.content.nativeElement.style.transition = "opacity 200ms ease-out, transform 200ms ease-out";
      // forza repaint e poi ripristina transform/opacità/bordo
      void this.content.nativeElement.offsetWidth;
      this.content.nativeElement.style.transform = "rotate(0deg) translateX(0%)";
      this.content.nativeElement.style.opacity = "1";
      this.content.nativeElement.style.border = "1px solid #2d2d2dff";
      // quando la transizione di reset è finita, riabilitiamo pannelli e stato dragging
      const onEnd = () => {
        this.isDragging.set(false);
        this.sidesHidden.set(false);
        this.content!.nativeElement.removeEventListener("transitionend", onEnd);
      };
      this.content.nativeElement.addEventListener("transitionend", onEnd);
    }
		// Ricalcola la posizione centrale (chiama updateHostSize per aggiornare dragPosition)
		this.updateHostSize();
	}
}
