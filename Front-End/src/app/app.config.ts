import {
	provideHttpClient,
	withFetch,
	withInterceptors,
} from "@angular/common/http";
import {
	type ApplicationConfig,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
} from "@angular/core";
import {
	provideClientHydration,
	withEventReplay,
} from "@angular/platform-browser";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import Aura from "@primeuix/themes/aura";
import { providePrimeNG } from "primeng/config";
import { routes } from "./app.routes";
import { getTokenInterceptor } from "./interceptors/get-token-interceptor";
import { tokenInterceptor } from "./interceptors/token-interceptor";

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(routes, withComponentInputBinding()),
		provideClientHydration(withEventReplay()),
		provideHttpClient(
			withFetch(),
			withInterceptors([tokenInterceptor, getTokenInterceptor]),
		),
		provideAnimationsAsync(),
		providePrimeNG({
			theme: {
				preset: Aura,
			},
		}),
	],
};
