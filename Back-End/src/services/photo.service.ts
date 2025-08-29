import type { components } from "@generated/typescript/api";
import { PhotoRepository } from "@repositories/photo.repository";
import type { Express } from "express";
import { pool } from "../database";

type Photo = components["schemas"]["Photo"];

export class PhotoService {
	private photoRepository: PhotoRepository;

	constructor() {
		this.photoRepository = new PhotoRepository(pool, "photos");
	}

	async getUserPhotos(userId: string): Promise<Photo[]> {
		return await this.photoRepository.findByUserId(userId);
	}

	async uploadPhoto(userId: string, file: Express.Multer.File): Promise<Photo> {
		// Validate file type, size, etc.
		if (!this.isValidImageFile(file)) {
			throw new Error("Invalid image file");
		}

		// Check user photo limit (e.g., max 5 photos)
		const existingPhotos = await this.photoRepository.countByUserId(userId);
		if (existingPhotos >= 5) {
			throw new Error("Maximum number of photos reached");
		}

		return await this.photoRepository.createPhoto(userId, file);
	}

	async getPhotoById(photoId: string, userId: string): Promise<Photo | null> {
		return await this.photoRepository.findByIdAndUser(photoId, userId);
	}

	async deletePhoto(photoId: string, userId: string): Promise<boolean> {
		return await this.photoRepository.deleteByIdAndUser(photoId, userId);
	}

	async setMainPhoto(photoId: string, userId: string): Promise<boolean> {
		return await this.photoRepository.setAsMain(photoId, userId);
	}

	private isValidImageFile(file: Express.Multer.File): boolean {
		const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
		const maxSize = 5 * 1024 * 1024; // 5MB

		return allowedMimeTypes.includes(file.mimetype) && file.size <= maxSize;
	}
}
