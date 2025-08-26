import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEndpoint, HttpMethod, HttpRequestService } from '../../../services/http-request';
import { Geolocation } from '../../../services/geolocation';
import { components } from '../../../../types/api'; // Adjust the path as necessary
import { Component, inject, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

import { StepperModule } from 'primeng/stepper';
//import { ToggleButton } from 'primeng/togglebutton';
//import { IconField } from 'primeng/iconfield';
//import { InputIcon } from 'primeng/inputicon';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';

type RegisterRequest = components['schemas']['RegisterRequest'];
type RegisterResponse = components['schemas']['RegisterResponse'];

//function minAgeDateValidator(min: number): ValidatorFn {
//  return (control: AbstractControl) => {
//    const v = control.value;
//    if (!v) return { required: true };
//    if (!(v instanceof Date)) return { invalidDate: true };
//    const today = new Date();
//    let age = today.getFullYear() - v.getFullYear();
//    const m = today.getMonth() - v.getMonth();
//    if (m < 0 || (m === 0 && today.getDate() < v.getDate())) age--;
//    return age >= min ? null : { minAge: { required: min, actual: age } };
//  };
//}

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, InputTextModule, InputGroupModule, InputGroupAddonModule, ButtonModule, ToggleSwitchModule, TextareaModule, SelectModule, StepperModule, CommonModule, MessageModule, DatePickerModule],
  templateUrl: './register-form.html',
  styles: `
 	.register-btn {
	  width: 100%;
	  margin-bottom: 2rem;
	}
	.p-step-panels {
	  height: 420px !important;
	}
	:host {
		--stepper-panels-height: 420px !important;
	}
	:host ::ng-deep .p-stepper-panels {
      flex: 0 0 420px; /* altezza fissa */
      height: 420px;
      overflow: auto; /* scroll interno se il contenuto supera l'altezza */
      position: relative;
    }
	.step-content {
	  display: flex;
	  flex-direction: column;
	  gap: 1rem;
	  margin: 0 auto;
	  min-height: 16rem;
	  max-width: 24rem;
	  overflow-y: auto;
	  height: 300px;
	}
  .location {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: nowrap;
  }

  .location > legend {
    margin: 0;
    padding-right: 0.5rem;
    flex: 0 0 auto;
  }

  .location .location-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex: 1 1 auto;
  }

  .location .manual-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  `
})
export class RegisterForm implements AfterViewInit, OnDestroy {
  @ViewChild('leafletMap', { static: false }) leafletMap?: ElementRef<HTMLDivElement>;
  httpEndpoint: HttpEndpoint = "/auth/register"
  httpMethod: HttpMethod = "POST"

  private map: any = null;
  private marker: any = null;
  private manualSub?: Subscription;
  private leafletModule: any = null;

  registerForm = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    email: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(6)]}),
    first_name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    last_name: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    age: new FormControl<number | null>(null, {nonNullable: true, validators: [Validators.required, Validators.min(18)]}),
    bio: new FormControl('', {nonNullable: true}),

    location: new FormGroup({
      lat: new FormControl<number | null>(null),
      lng: new FormControl<number | null>(null)
    }),

    location_manual: new FormControl<boolean>(false, {nonNullable: true}),
    sexual_orientation: new FormControl<'heterosexual' | 'homosexual' | 'bisexual' | ''>('', {nonNullable: true, validators: [Validators.required]}),
    gender: new FormControl<'male' | 'female' | 'other' | ''>('', {nonNullable: true, validators: [Validators.required]})
  });

  getMyLocation() {
    this.geo.getLocation().then(loc => {
      const lat = loc.location.latitude;
      const lng = loc.location.longitude;
      this.registerForm.get('location')?.patchValue({ lat, lng });
      this.centerMap(lat, lng);
    }).catch(error => {
      console.error('Error getting location:', error);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    // initialize map if manual is already true
    if (this.registerForm.get('location_manual')?.value) {
      this.initMapIfNeeded();
    }

    // watch toggle and init/destroy map accordingly
    this.manualSub = this.registerForm.get('location_manual')!.valueChanges.subscribe(val => {
      if (val) {
        // small timeout to allow DOM to render map container when *ngIf is used
        setTimeout(() => this.initMapIfNeeded(), 50);
      } else {
        this.destroyMap();
      }
    });
  }

  ngOnDestroy(): void {
    this.manualSub?.unsubscribe();
    this.destroyMap();
  }

  private async initMapIfNeeded(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.leafletMap?.nativeElement) return;
    if (this.map) {
      // already initialized
      const lat = this.registerForm.get('location')?.get('lat')?.value ?? 45.4642;
      const lng = this.registerForm.get('location')?.get('lng')?.value ?? 9.1900;
      this.centerMap(lat, lng);
      return;
    }

    const mod = await import('leaflet');
    const L = (mod as any).default ?? mod;
    this.leafletModule = L;

     if (!(L.Icon.Default as any).__assetsConfigured) {
      L.Icon.Default.mergeOptions({
       // public/media/leaflet -> servito come /media/leaflet/...
       iconRetinaUrl: 'leaflet/marker-icon-2x.png',
       iconUrl: 'leaflet/marker-icon.png',
       shadowUrl: 'leaflet/marker-shadow.png',
       iconSize: [25, 41],
       iconAnchor: [12, 41],
       popupAnchor: [1, -34],
       shadowSize: [41, 41]
      });
      (L.Icon.Default as any).__assetsConfigured = true;
    }

    const lat = this.registerForm.get('location')?.get('lat')?.value ?? 45.4642;
    const lng = this.registerForm.get('location')?.get('lng')?.value ?? 9.1900;
    this.map = L.map(this.leafletMap!.nativeElement).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      this.marker.setLatLng([newLat, newLng]);
      this.updateFormLocation(newLat, newLng);
    });

    this.marker.on('dragend', () => {
      const p = this.marker.getLatLng();
      this.updateFormLocation(p.lat, p.lng);
    });

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private centerMap(lat: number, lng: number): void {
    if (!this.map) return;
    const pos: L.LatLngExpression = [lat, lng];
    this.map.setView(pos, this.map.getZoom() ?? 13);
    if (this.marker) this.marker.setLatLng(pos);
  }

  private updateFormLocation(lat: number, lng: number): void {
    // run inside angular zone via plain patchValue (no heavy change detection needed)
    this.registerForm.get('location')?.patchValue({ lat, lng });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const credentials = this.registerForm.value as RegisterRequest;
      console.log('Form submitted with:', credentials);

      this.auth.request(credentials, this.httpEndpoint, this.httpMethod).subscribe({
        next: (response : RegisterResponse) => {
          console.log('Register success:', response);
        },
        error: (error) => {
          console.error('Register error:', error);
        }
      });
    } else {
      console.error('Form is invalid');
    }
  }

  auth = inject(HttpRequestService);
  geo = inject(Geolocation);

  // use setter so we can detect when panel 4 becomes active and then invalidate the map
  private _activeStep: number = 1;
  get activeStep(): number { return this._activeStep; }
  set activeStep(v: number) {
    this._activeStep = v;
    // if user opened the location step, ensure map is initialized and resized
    if (v === 4) {
      // init if manual toggle already on, otherwise just try to invalidate later
      setTimeout(() => this.initMapIfNeeded(), 50);
      // extra safety: attempt to invalidate a bit later in case animation hides it
      setTimeout(() => { try { this.map?.invalidateSize?.(); } catch(e){} }, 300);
      setTimeout(() => { try { this.map?.invalidateSize?.(); } catch(e){} }, 800);
    }
  }

  orientationOptions = [
    { label: 'Heterosexual', value: 'heterosexual' },
    { label: 'Homosexual', value: 'homosexual' },
    { label: 'Bisexual', value: 'bisexual' }
  ];
  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];
}
