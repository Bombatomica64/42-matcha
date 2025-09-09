// Unified Photo interface that matches both database and API schema
export interface Photo {
	id: string;
	user_id: string;
	filename: string;
	original_filename?: string;
	file_path: string; // This is the file_path in database but presented as image_url
	file_size?: number;
	mime_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
	is_main: boolean;
	display_order: number;
	uploaded_at: string; // This is created_at in database but presented as uploaded_at
}

export type CreatePhotoData = Omit<Photo, "id" | "uploaded_at">;
export type UpdatePhotoData = Partial<Omit<Photo, "id" | "user_id" | "uploaded_at">>;

// Database field mapping (for SQL queries only)
export const DB_FIELD_MAP = {
	user_id: "user_id",
	image_url: "file_path",
	is_main: "is_primary",
	uploaded_at: "created_at",
} as const;
