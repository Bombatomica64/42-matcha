import { PhotoController } from "@controllers/photo.controller";
import { PhotoService } from "@services/photo.service";
import { Router } from "express";
import multer from "multer";

const upload = multer({
	dest: "uploads/",
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"));
		}
	},
});

const photoRoutes = (): Router => {
	const router = Router();
	const photoService = new PhotoService();
	const photoController = new PhotoController(photoService);

	// Photo endpoints
	router.get("/", photoController.getUserPhotos.bind(photoController));
	router.post("/", upload.single("photo"), photoController.uploadPhoto.bind(photoController));
	router.get("/:photoId", photoController.getPhotoById.bind(photoController));
	router.delete("/:photoId", photoController.deletePhoto.bind(photoController));
	router.post("/:photoId/main", photoController.setMainPhoto.bind(photoController));

	return router;
};

export default photoRoutes;
