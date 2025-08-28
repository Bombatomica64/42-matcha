import { validatePatchRequest, validatePutRequest } from "@utils/user-validation";
import type { NextFunction, Request, Response } from "express";

/**
 * Middleware to validate PUT requests for user profile updates
 * Requires all mandatory fields and validates field types
 */
export function validateUserPutRequest(req: Request, res: Response, next: NextFunction) {
	const validation = validatePutRequest(req.body);

	if (!validation.isValid) {
		return res.status(400).json({
			error: "Validation failed",
			message: "Invalid request body for profile update",
			details: validation.errors,
			code: "VALIDATION_ERROR",
		});
	}

	// Replace request body with cleaned data
	req.body = validation.cleanedData;
	next();
}

/**
 * Middleware to validate PATCH requests for user profile updates
 * Allows partial updates but validates field types
 */
export function validateUserPatchRequest(req: Request, res: Response, next: NextFunction) {
	const validation = validatePatchRequest(req.body);

	if (!validation.isValid) {
		return res.status(400).json({
			error: "Validation failed",
			message: "Invalid request body for profile update",
			details: validation.errors,
			code: "VALIDATION_ERROR",
		});
	}

	// Replace request body with cleaned data
	req.body = validation.cleanedData;
	next();
}

/**
 * Generic validation middleware factory
 * Can be used for other validation scenarios
 */
export function createValidationMiddleware(
	validator: (body: Record<string, unknown>) => {
		isValid: boolean;
		errors: string[];
		cleanedData: Record<string, unknown>;
	},
) {
	return (req: Request, res: Response, next: NextFunction) => {
		const validation = validator(req.body);

		if (!validation.isValid) {
			return res.status(400).json({
				error: "Validation failed",
				message: "Invalid request body",
				details: validation.errors,
				code: "VALIDATION_ERROR",
			});
		}

		req.body = validation.cleanedData;
		next();
	};
}
