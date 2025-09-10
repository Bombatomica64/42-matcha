import {
	type AfterViewInit,
	Component,
	type ElementRef,
	EventEmitter,
	Input,
	type OnChanges,
	type OnDestroy,
	Output,
	type SimpleChanges,
	ViewChild,
} from "@angular/core";

@Component({
	selector: "app-map",
	imports: [],
	template: `
    <!-- height/width possono essere passati come stringhe: '300px' o '50vh' o '100%' -->
    <div #mapContainer class="leaflet-map" [style.height]="height" [style.width]="width"></div>
  `,
	styles: `
    :host { display: block; width: 100%; }
    .leaflet-map { height: 300px; width: 100%; border-radius: 0.5rem; overflow: hidden; }
  `,
})
export class Map implements AfterViewInit, OnDestroy, OnChanges {
	// Defaults can be overridden by parent via [height] and [width]
	@Input() height: string = "300px";
	@Input() width: string = "100%";
	// apply same inline styles to the host element so the wrapper doesn't keep extra/default size
	@Input() lat?: number | null;
	@Input() lng?: number | null;
	@Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();
	@ViewChild("mapContainer", { static: true })
	mapContainer!: ElementRef<HTMLDivElement>;

	private map: any = null;
	private marker: any = null;
	private leaflet: any = null;
	private initializing = false;

	async ngAfterViewInit() {
		if (this.lat != null && this.lng != null) {
			await this.initMap();
		}
	}

	async ngOnChanges(changes: SimpleChanges) {
		// if lat/lng changed after init, center/update marker
		if ((changes["lat"] || changes["lng"]) && this.map) {
			// log input changes when map already initialized
			const prevLat = changes["lat"]?.previousValue;
			const prevLng = changes["lng"]?.previousValue;
			const curLat = changes["lat"]?.currentValue ?? this.lat;
			const curLng = changes["lng"]?.currentValue ?? this.lng;
			console.log("Map input changed:", {
				previous: { lat: prevLat, lng: prevLng },
				current: { lat: curLat, lng: curLng },
			});
			const lat = this.lat ?? 45.4642;
			const lng = this.lng ?? 9.19;
			try {
				this.map.setView([lat, lng], this.map.getZoom?.() ?? 13);
				this.marker?.setLatLng([lat, lng]);
			} catch (e) {
				/* ignore */
			}
		} else if (!this.map && this.lat != null && this.lng != null) {
			// lazy init if inputs arrive later
			console.log("Map inputs received before init, initializing with", {
				lat: this.lat,
				lng: this.lng,
			});
			await this.initMap();
		}
	}

	ngOnDestroy(): void {
		if (this.map) {
			this.map.off();
			this.map.remove();
			this.map = null;
			this.marker = null;
		}
		// Cleanup possible leftover Leaflet internal marker on container
		try {
			if (
				this.mapContainer?.nativeElement &&
				(this.mapContainer.nativeElement as any)._leaflet_id
			) {
				delete (this.mapContainer.nativeElement as any)._leaflet_id;
			}
		} catch (e) {
			/* ignore */
		}
	}

	private async initMap(): Promise<void> {
		if (typeof window === "undefined" || !this.mapContainer) return;
		if (this.map) return;
		if (this.initializing) return;
		this.initializing = true;

		const mod = await import("leaflet");
		const L = (mod as any).default ?? mod;
		this.leaflet = L;

		if (!(L.Icon.Default as any).__assetsConfigured) {
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: "leaflet/marker-icon-2x.png",
				iconUrl: "leaflet/marker-icon.png",
				shadowUrl: "leaflet/marker-shadow.png",
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41],
			});
			(L.Icon.Default as any).__assetsConfigured = true;
		}

		const lat = this.lat ?? 45.4642;
		const lng = this.lng ?? 9.19;
		// If the container was previously initialized by Leaflet, remove its internal id to allow re-init.
		// This is a pragmatic fix for "Map container is already initialized" when Angular reuses DOM.
		try {
			if (
				this.mapContainer?.nativeElement &&
				(this.mapContainer.nativeElement as any)._leaflet_id
			) {
				delete (this.mapContainer.nativeElement as any)._leaflet_id;
			}
		} catch (e) {
			/* ignore */
		}

		try {
			this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], 13);
		} catch (err) {
			// If initialization still fails, clean internal id and retry once
			try {
				if (
					this.mapContainer?.nativeElement &&
					(this.mapContainer.nativeElement as any)._leaflet_id
				) {
					delete (this.mapContainer.nativeElement as any)._leaflet_id;
				}
				this.map = L.map(this.mapContainer.nativeElement).setView(
					[lat, lng],
					13,
				);
			} catch (err2) {
				console.error("Failed to initialize Leaflet map:", err2);
				this.initializing = false;
				return;
			}
		} finally {
			this.initializing = false;
		}

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "&copy; OpenStreetMap contributors",
		}).addTo(this.map);

		this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

		this.map.on("click", (e: any) => {
			const { lat: newLat, lng: newLng } = e.latlng;
			this.marker.setLatLng([newLat, newLng]);
			// log and emit asynchronously to avoid sync change-detection issues in parent
			setTimeout(() => {
				console.log("Map click -> new location", { lat: newLat, lng: newLng });
				this.locationChange.emit({ lat: newLat, lng: newLng });
			}, 0);
		});

		this.marker.on("dragend", () => {
			const p = this.marker.getLatLng();
			// log and emit asynchronously to avoid sync change-detection issues in parent
			setTimeout(() => {
				console.log("Marker dragend -> new location", {
					lat: p.lat,
					lng: p.lng,
				});
				this.locationChange.emit({ lat: p.lat, lng: p.lng });
			}, 0);
		});

		setTimeout(() => this.map?.invalidateSize(), 200);
	}
}
