import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { tokenInterceptor } from './interceptors/token-interceptor';
import { getTokenInterceptor } from './interceptors/get-token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
	  provideHttpClient(withFetch(), withInterceptors([tokenInterceptor, getTokenInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
		theme: {
			preset: Aura
        }
	})
    ]
};
