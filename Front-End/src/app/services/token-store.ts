import { Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
// import { AuthService } from '../jwthandler.service';
import { firstValueFrom } from 'rxjs';

/**
 * Represents the structure of the JWT token payload
 */
interface TokenPayload {
	/** Subject (user ID) */
	sub: string;
	/** Expiration timestamp */
	exp: number;
}

/**
 * Service responsible for securely storing and managing authentication tokens
 * Handles token storage, retrieval, and validation
 */
@Injectable({
	providedIn: 'root',
})
export class TokenStore {
	private readonly TOKEN_KEY = 'access_token';
	private readonly REFRESH_TOKEN_KEY = 'refresh_token';
	private platformId = inject(PLATFORM_ID);

	// Signal-based token storage
	private accessTokenSignal = signal<string | null>(null);
	private refreshTokenSignal = signal<string | null>(null);

	/**
	 * Creates a new TokenStoreService instance
	 * Initializes tokens from localStorage if in browser environment
	 */
	constructor() {
		// Initialize from localStorage only in browser
		this.initTokensFromStorage();
	}

	/**
	 * Loads stored tokens from localStorage if available
	 * Only runs in browser environments
	 */
	private initTokensFromStorage(): void {
		if (isPlatformBrowser(this.platformId)) {
			const accessToken = localStorage.getItem(this.TOKEN_KEY);
			const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

			this.accessTokenSignal.set(accessToken);
			this.refreshTokenSignal.set(refreshToken);
		}
	}

	/**
	 * Retrieves the current access token if valid
	 * @returns The access token string or null if not available or expired
	 */
	getAccessToken(): string | null {
		const token = this.accessTokenSignal();
		if (token && this.isTokenExpired(token)) {
			return null;
		}
		return token;
	}

	/**
	 * Gets the current refresh token
	 * @returns The refresh token string or null if not available
	 */
	getRefreshToken(): string | null {
		return this.refreshTokenSignal();
	}

	/**
	 * Stores new authentication tokens
	 * @param accessToken - The JWT access token
	 * @param refreshToken - The refresh token for obtaining new access tokens
	 */
	setTokens(accessToken: string): void { //,refreshToken: string
		this.accessTokenSignal.set(accessToken);
		// this.refreshTokenSignal.set(refreshToken);

		if (isPlatformBrowser(this.platformId)) {
			localStorage.setItem(this.TOKEN_KEY, accessToken);
			// localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
		}
	}

	/**
	 * Removes all authentication tokens
	 * Used for logout or when tokens are invalid
	 */
	clearTokens(): void {
		this.accessTokenSignal.set(null);
		this.refreshTokenSignal.set(null);

		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem(this.TOKEN_KEY);
			localStorage.removeItem(this.REFRESH_TOKEN_KEY);
		}
	}

	/**
	 * Checks if a JWT token has expired
	 * @param token - The JWT token to check
	 * @returns True if the token has expired, false otherwise
	 */
	isTokenExpired(token: string): boolean {
		try {
			const decoded = jwtDecode<TokenPayload>(token);
			return decoded.exp * 1000 < Date.now();
		} catch (e) {
			return true;
		}
	}

	/**
	 * Ensures the access token is valid, refreshing it if necessary
	 * @returns A promise that resolves to a valid access token
	 */
	async ensureValidAccessToken(): Promise<string | null> {
		const token = this.getAccessToken();
		if (token && !this.isTokenExpired(token)) {
			return token;
		}

		// const refreshToken = this.getRefreshToken();
		// if (refreshToken) {
		// 	const authService = inject(AuthService);
		// 	const tokens = await firstValueFrom(authService.refreshToken());
		// 	this.setTokens(tokens.accessToken, tokens.refreshToken);
		// 	return tokens.accessToken;
		// }

		return null;
	}

	isLoggedin(): boolean {
		const token = this.getAccessToken();
		if (token) {
			const decoded = jwtDecode<TokenPayload>(token);
			return decoded.exp * 1000 > Date.now();
		}

		// Check if refresh token exists as a fallback
		// const refreshToken = this.getRefreshToken();
		// if (refreshToken) {
		// 	const decoded = jwtDecode<TokenPayload>(refreshToken);
		// 	return decoded.exp * 1000 > Date.now();
		// }
		return false;
	}

	logout(): void {
		this.clearTokens();
		if (isPlatformBrowser(this.platformId)) {
			window.location.href = '/login';
		}
	}
}
