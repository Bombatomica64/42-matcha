import { Injectable } from "@angular/core";
import axios from "axios";

@Injectable({
	providedIn: "root",
})
export class Geolocation {
	async getLocation(options?: PositionOptions): Promise<{
		ip: string;
		location: { latitude: number; longitude: number };
	}> {
		// Fallback immediately if navigator or geolocation not available (SSR or unsupported browser)
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			try {
				return await this.getIpLocation();
			} catch {
				throw new Error("Geolocation and IP-based location failed.");
			}
		}

		// Try browser geolocation first
		try {
			const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
				navigator.geolocation.getCurrentPosition(resolve, reject, options),
			);
			return {
				ip: "unknown",
				location: {
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				},
			};
		} catch {
			// Fallback to IP-based lookup
			try {
				return await this.getIpLocation();
			} catch {
				throw new Error("Geolocation and IP-based location failed.");
			}
		}
	}

	private async getIpLocation(): Promise<{
		ip: string;
		location: { latitude: number; longitude: number };
	}> {
		const response = await axios.get("https://ipapi.co/json/");
		return {
			ip: response.data.ip,
			location: {
				latitude: response.data.latitude,
				longitude: response.data.longitude,
			},
		};
	}
}
