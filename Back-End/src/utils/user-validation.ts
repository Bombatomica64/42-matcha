import type { UpdateUserData } from "@models/user.entity";

// Define readonly fields that cannot be modified
export const READONLY_FIELDS = [
	"id",
	"created_at",
	"updated_at",
	"activated",
	"email_verified_at",
	"password_reset_token",
	"password_reset_expires_at",
	"likes_received_count",
	"views_count",
	"matches_count",
	"photos", // Photos are managed through separate endpoints
	"hashtags", // Hashtags might be managed separately
] as const;

// Define fields that are only modifiable through specific endpoints
export const SPECIAL_FIELDS = [
	"password", // Only through password change endpoint
	"email_verification_token", // Only through verification process
	"online_status", // Only through login/logout
	"last_seen", // Automatically updated
] as const;

// Define required fields for full profile updates (PUT)
export const REQUIRED_FIELDS_FOR_PUT = [
	"username",
	"first_name",
	"last_name",
	"bio",
	"gender",
	"sexual_orientation",
] as const;

// Define all modifiable fields
export const MODIFIABLE_FIELDS = [
	"username",
	"email",
	"birth_date",
	"bio",
	"first_name",
	"last_name",
	"gender",
	"sexual_orientation",
	"location",
	"location_manual",
	"fame_rating",
	"profile_complete",
] as const;

export type ModifiableField = (typeof MODIFIABLE_FIELDS)[number];
export type ReadonlyField = (typeof READONLY_FIELDS)[number];
export type SpecialField = (typeof SPECIAL_FIELDS)[number];
export type ForbiddenField = ReadonlyField | SpecialField;

/**
 * Validates that request body only contains modifiable fields
 */
export function validateModifiableFields(body: Record<string, unknown>): {
	isValid: boolean;
	errors: string[];
	invalidFields: string[];
} {
	const errors: string[] = [];
	const invalidFields: string[] = [];

	for (const field of Object.keys(body)) {
		const isReadonlyField = (READONLY_FIELDS as readonly string[]).includes(field);
		const isSpecialField = (SPECIAL_FIELDS as readonly string[]).includes(field);
		const isModifiableField = (MODIFIABLE_FIELDS as readonly string[]).includes(field);

		if (isReadonlyField || isSpecialField) {
			invalidFields.push(field);
			if (isReadonlyField) {
				errors.push(`Field '${field}' is readonly and cannot be modified`);
			} else {
				errors.push(`Field '${field}' can only be modified through specific endpoints`);
			}
		} else if (!isModifiableField) {
			invalidFields.push(field);
			errors.push(`Field '${field}' is not a valid user field`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		invalidFields,
	};
}

/**
 * Validates required fields for PUT requests
 */
export function validateRequiredFields(body: Record<string, unknown>): {
	isValid: boolean;
	errors: string[];
	missingFields: string[];
} {
	const errors: string[] = [];
	const missingFields: string[] = [];

	for (const field of REQUIRED_FIELDS_FOR_PUT) {
		if (
			!(field in body) ||
			body[field] === undefined ||
			body[field] === null ||
			body[field] === ""
		) {
			missingFields.push(field);
			errors.push(`Field '${field}' is required for profile updates`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		missingFields,
	};
}

/**
 * Validates specific field values
 */
export function validateFieldValues(body: Partial<UpdateUserData>): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Validate gender
	if (body.gender && !["male", "female", "other"].includes(body.gender)) {
		errors.push("Gender must be 'male', 'female', or 'other'");
	}

	// Validate sexual orientation
	if (
		body.sexual_orientation &&
		!["heterosexual", "homosexual", "bisexual"].includes(body.sexual_orientation)
	) {
		errors.push("Sexual orientation must be 'heterosexual', 'homosexual', or 'bisexual'");
	}

	// Validate birth_date (must be in the past and user must be at least 18)
	if (body.birth_date) {
		const birthDate = new Date(body.birth_date);
		const today = new Date();
		const age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();

		if (birthDate > today) {
			errors.push("Birth date cannot be in the future");
		} else if (age < 18 || (age === 18 && monthDiff < 0)) {
			errors.push("User must be at least 18 years old");
		}
	}

	// Validate fame_rating
	if (body.fame_rating !== undefined && (body.fame_rating < 0 || body.fame_rating > 5)) {
		errors.push("Fame rating must be between 0 and 5");
	}

	// Validate location format
	if (body.location) {
		if (
			typeof body.location !== "object" ||
			body.location.type !== "Point" ||
			!Array.isArray(body.location.coordinates) ||
			body.location.coordinates.length !== 2 ||
			typeof body.location.coordinates[0] !== "number" ||
			typeof body.location.coordinates[1] !== "number"
		) {
			errors.push("Location must be a valid GeoJSON Point with [longitude, latitude] coordinates");
		} else {
			const [lng, lat] = body.location.coordinates;
			if (lng < -180 || lng > 180) {
				errors.push("Longitude must be between -180 and 180");
			}
			if (lat < -90 || lat > 90) {
				errors.push("Latitude must be between -90 and 90");
			}
		}
	}

	// Validate string lengths
	if (body.username && (body.username.length < 3 || body.username.length > 20)) {
		errors.push("Username must be between 3 and 20 characters");
	}

	if (body.first_name && (body.first_name.length < 1 || body.first_name.length > 50)) {
		errors.push("First name must be between 1 and 50 characters");
	}

	if (body.last_name && (body.last_name.length < 1 || body.last_name.length > 50)) {
		errors.push("Last name must be between 1 and 50 characters");
	}

	if (body.bio && body.bio.length > 500) {
		errors.push("Bio must not exceed 500 characters");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Complete validation for PUT requests (full update)
 */
export function validatePutRequest(body: Record<string, unknown>): {
	isValid: boolean;
	errors: string[];
	cleanedData: Partial<UpdateUserData>;
} {
	const modifiableValidation = validateModifiableFields(body);
	const requiredValidation = validateRequiredFields(body);

	if (!modifiableValidation.isValid || !requiredValidation.isValid) {
		return {
			isValid: false,
			errors: [...modifiableValidation.errors, ...requiredValidation.errors],
			cleanedData: {},
		};
	}

	// Extract only modifiable fields
	const cleanedData: Record<string, unknown> = {};
	for (const field of MODIFIABLE_FIELDS) {
		if (field in body) {
			cleanedData[field] = body[field];
		}
	}

	const valueValidation = validateFieldValues(cleanedData as Partial<UpdateUserData>);

	return {
		isValid: valueValidation.isValid,
		errors: valueValidation.errors,
		cleanedData: valueValidation.isValid ? (cleanedData as Partial<UpdateUserData>) : {},
	};
}

/**
 * Complete validation for PATCH requests (partial update)
 */
export function validatePatchRequest(body: Record<string, unknown>): {
	isValid: boolean;
	errors: string[];
	cleanedData: Partial<UpdateUserData>;
} {
	const modifiableValidation = validateModifiableFields(body);

	if (!modifiableValidation.isValid) {
		return {
			isValid: false,
			errors: modifiableValidation.errors,
			cleanedData: {},
		};
	}

	// Extract only modifiable fields
	const cleanedData: Record<string, unknown> = {};
	for (const field of MODIFIABLE_FIELDS) {
		if (field in body) {
			cleanedData[field] = body[field];
		}
	}

	const valueValidation = validateFieldValues(cleanedData as Partial<UpdateUserData>);

	return {
		isValid: valueValidation.isValid,
		errors: valueValidation.errors,
		cleanedData: valueValidation.isValid ? (cleanedData as Partial<UpdateUserData>) : {},
	};
}
