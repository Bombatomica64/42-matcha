/**
 * Mapping utilities between database entities and API types
 * This allows us to keep clean separation between internal models and API contracts
 */

import type { components } from "@generated/typescript/api";
import type { User as DbUser } from "@models/user.entity";
import { logger } from "../server";

// API types for convenience
type ApiUser = components["schemas"]["User"];
type ApiPhoto = components["schemas"]["Photo"];

/**
 * Convert database User entity to API User response
 * This handles the complex database relations and flattens them for API consumption
 */
export function dbUserToApiUser(dbUser: DbUser): ApiUser {
	let location: { latitude: number; longitude: number } | undefined;

	if (
		dbUser.location &&
		typeof dbUser.location === "object" &&
		"coordinates" in dbUser.location &&
		Array.isArray((dbUser.location as any).coordinates) &&
		(dbUser.location as any).coordinates.length === 2
	) {
		// GeoJSON Point coordinates are [longitude, latitude]
		const [lon, lat] = (dbUser.location as any).coordinates as [number, number];
		location = { latitude: lat, longitude: lon };
	}

	logger.info(`User Location resolved -> ${location ? `${location.latitude},${location.longitude}` : "undefined"}`);

	return {
		id: dbUser.id,
		email: dbUser.email,
		name: dbUser.username, // Map username to name for API
		birth_date: dbUser.birth_date?.toISOString(),
		bio: dbUser.bio,
		first_name: dbUser.first_name,
		last_name: dbUser.last_name,
		gender: dbUser.gender,
		sexual_orientation: dbUser.sexual_orientation,
		location: location,
		fame_rating: dbUser.fame_rating,
		online_status: dbUser.online_status,
		likes_received: dbUser.likes_received_count,
		views: dbUser.views_count,
		matches: dbUser.matches_count,
		// Convert database photos to API photos
		photos: dbUser.photos?.map((photo) => ({
			id: photo.id,
			user_id: photo.user_id,
			image_url: photo.image_url,
			is_main: photo.is_main,
			uploaded_at: photo.uploaded_at,
		})) as ApiPhoto[],
		// Hashtags are already strings in DB
		hashtags: dbUser.hashtags,
	};
}

/**
 * Convert API user data to database user data for creation
 * This handles the reverse mapping for user registration/updates
 */
export function apiUserToDbUser(apiData: Partial<ApiUser>): Partial<DbUser> {
	return {
		username: apiData.name || "",
		email: apiData.email,
		birth_date: apiData.birth_date ? new Date(apiData.birth_date) : undefined,
		bio: apiData.bio,
		first_name: apiData.first_name,
		last_name: apiData.last_name,
		gender: apiData.gender,
		// Filter out 'other' since DB doesn't support it
		sexual_orientation:
			apiData.sexual_orientation === "other" ? "bisexual" : apiData.sexual_orientation,
		location:
			apiData.location &&
			apiData.location.longitude !== undefined &&
			apiData.location.latitude !== undefined
				? {
						type: "Point",
						coordinates: [apiData.location.longitude, apiData.location.latitude],
					}
				: undefined,
		// Note: photos and hashtags are handled separately in the service layer
	};
}

/**
 * Create a privacy-safe user response (for public profiles)
 * This removes sensitive information when showing user to others
 */
export function createPublicUserResponse(dbUser: DbUser, includeEmail: boolean = false): ApiUser {
	const apiUser = dbUserToApiUser(dbUser);

	if (!includeEmail) {
		delete apiUser.email;
	}

	return apiUser;
}

/**
 * Create a minimal user response (for lists/search results)
 * This includes only essential information for performance
 */
export function createMinimalUserResponse(dbUser: DbUser): Partial<ApiUser> {
	return {
		id: dbUser.id,
		name: dbUser.username,
		first_name: dbUser.first_name,
		last_name: dbUser.last_name,
		birth_date: dbUser.birth_date.getDate() ? dbUser.birth_date.toISOString() : undefined,
		bio: dbUser.bio,
		gender: dbUser.gender,
		fame_rating: dbUser.fame_rating,
		online_status: dbUser.online_status,
		// Include only primary photo for performance
		photos: dbUser.photos
			?.filter((photo) => photo.is_main)
			.slice(0, 1)
			.map((photo) => ({
				id: photo.id,
				user_id: photo.user_id,
				image_url: photo.image_url,
				is_main: true,
				uploaded_at: photo.uploaded_at,
			})) as ApiPhoto[],
		hashtags: dbUser.hashtags,
	};
}

/**
 * Validate API user data against business rules
 */
export function validateUserData(userData: Partial<ApiUser>): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (userData.birth_date) {
		const birthDate = new Date(userData.birth_date);
		const age = new Date().getFullYear() - birthDate.getFullYear();
		if (age < 18) {
			errors.push("User must be at least 18 years old");
		}
	}

	if (userData.bio && userData.bio.length > 500) {
		errors.push("Bio must be 500 characters or less");
	}

	if (userData.hashtags && userData.hashtags.length > 10) {
		errors.push("Maximum 10 hashtags allowed");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
