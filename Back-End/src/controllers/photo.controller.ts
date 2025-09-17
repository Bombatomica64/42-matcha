import type { components } from "@generated/typescript/api";
import type { PhotoService } from "@services/photo.service";
import type { Request, Response } from "express";
import { logger } from "../server";

type ErrorResponse = components["schemas"]["ErrorResponse"];
type PhotoResponse = components["schemas"]["PhotoResponse"];
type PhotoListResponse = components["schemas"]["PhotoListResponse"];
type PhotoOrderUpdateRequest = {
	photoIds: string[];
};

export class PhotoController {
	private photoService: PhotoService;

	constructor(photoService: PhotoService) {
		this.photoService = photoService;
	}

	/**
	 * GET /photos - Get current user's photos
	 */
	public async getUserPhotos(_req: Request, res: Response): Promise<void> {
		try {
			const userId = res.locals.user?.id;
			if (!userId) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "User authentication required",
					code: "AUTH_REQUIRED",
				};
				res.status(401).json(errorResponse);
				return;
			}

			const photos = await this.photoService.getUserPhotos(userId);
			const response: PhotoListResponse = {
				photos: photos,
				total: photos.length,
			};

			res.status(200).json(response);
		} catch (error) {
			logger.error(`Failed to retrieve user photos: ${error}`);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to retrieve photos",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * POST /photos - Upload new photo
	 */
	public async uploadPhoto(req: Request, res: Response): Promise<void> {
		try {
			const userId = res.locals.user?.id;
			if (!userId) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "User authentication required",
					code: "AUTH_REQUIRED",
				};
				res.status(401).json(errorResponse);
				return;
			}

			if (!req.file) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "No photo file provided",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			const uploadedPhoto = await this.photoService.uploadPhoto(userId, req.file);
			const response: PhotoResponse = {
				message: "Photo uploaded successfully",
				photo: uploadedPhoto,
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error(`Failed to upload photo: ${error}`);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to upload photo",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * GET /photos/{photoId} - Get specific photo
	 */
	public async getPhotoById(req: Request, res: Response): Promise<void> {
		try {
			const { photoId } = req.params;
			const userId = res.locals.user?.id;

			if (!userId) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "User authentication required",
					code: "AUTH_REQUIRED",
				};
				res.status(401).json(errorResponse);
				return;
			}

			const photo = await this.photoService.getPhotoById(photoId, userId);
			if (!photo) {
				const errorResponse: ErrorResponse = {
					error: "Not Found",
					message: "Photo not found or access denied",
					code: "RESOURCE_NOT_FOUND",
				};
				res.status(404).json(errorResponse);
				return;
			}

			res.status(200).json(photo);
		} catch {
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to retrieve photo",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * DELETE /photos/{photoId} - Delete photo
	 */
	public async deletePhoto(req: Request, res: Response): Promise<void> {
		try {
			const { photoId } = req.params;
			const userId = res.locals.user?.id;

			if (!userId) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "User authentication required",
					code: "AUTH_REQUIRED",
				};
				res.status(401).json(errorResponse);
				return;
			}

			const deleted = await this.photoService.deletePhoto(photoId, userId);
			if (!deleted) {
				const errorResponse: ErrorResponse = {
					error: "Not Found",
					message: "Photo not found or access denied",
					code: "RESOURCE_NOT_FOUND",
				};
				res.status(404).json(errorResponse);
				return;
			}

			res.status(204).send();
		} catch {
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to delete photo",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * POST /photos/{photoId}/main - Set photo as main
	 */
	public async setMainPhoto(req: Request, res: Response): Promise<void> {
		try {
			const { photoId } = req.params;
			const userId = res.locals.user?.id;

			if (!userId) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "User authentication required",
					code: "AUTH_REQUIRED",
				};
				res.status(401).json(errorResponse);
				return;
			}

			const success = await this.photoService.setMainPhoto(photoId, userId);
			if (!success) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Failed to set main photo. Photo may not exist or belong to user.",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			// Get the updated photo (we know it exists since setMainPhoto succeeded)
			const updatedPhoto = await this.photoService.getPhotoById(photoId, userId);
			if (!updatedPhoto) {
				// This should not happen, but handle it just in case
				const errorResponse: ErrorResponse = {
					error: "Internal Server Error",
					message: "Photo was updated but could not be retrieved",
					code: "SERVER_ERROR",
				};
				res.status(500).json(errorResponse);
				return;
			}

			const response: PhotoResponse = {
				message: "Main photo updated successfully",
				photo: updatedPhoto,
			};

			res.status(200).json(response);
		} catch {
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to set main photo",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}

	/**
	 * PUT /photos/order - Update display order for current user's photos
	 */
	public async updateOrder(req: Request, res: Response): Promise<void> {
		try {
			const userId = res.locals.user?.id;
			if (!userId) {
				const errorResponse: ErrorResponse = {
					error: "Unauthorized",
					message: "User authentication required",
					code: "AUTH_REQUIRED",
				};
				res.status(401).json(errorResponse);
				return;
			}

			const body = req.body as Partial<PhotoOrderUpdateRequest> | undefined;
			const photoIds: string[] = Array.isArray(body?.photoIds) ? body.photoIds as string[] : [];
			if (!photoIds || photoIds.length === 0) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "photoIds array is required",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			const success = await this.photoService.updateOrder(userId, photoIds);
			if (!success) {
				const errorResponse: ErrorResponse = {
					error: "Bad Request",
					message: "Failed to update photo order",
					code: "VALIDATION_ERROR",
				};
				res.status(400).json(errorResponse);
				return;
			}

			res.status(204).send();
		} catch (error) {
			logger.error(`Failed to update photo order: ${error}`);
			const errorResponse: ErrorResponse = {
				error: "Internal Server Error",
				message: "Failed to update photo order",
				code: "SERVER_ERROR",
			};
			res.status(500).json(errorResponse);
		}
	}
}
