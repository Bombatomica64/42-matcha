import { inject } from "@angular/core/primitives/di";
import { type CanActivateFn, Router } from "@angular/router";
import { TokenStore } from "../services/token-store";

export const guestGuard: CanActivateFn = (_route, _state) => {
	const router = inject(Router);
	const tokenStore = inject(TokenStore);

	if (tokenStore.isLoggedin()) {
		router.navigate(["/home"]);
		return false;
	}
	return true;
};
