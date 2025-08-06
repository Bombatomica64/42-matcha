export interface UserPhoto {
	id: number;
	user_uuid: string; // UUID of the user - references users.id
	filename: string; // e.g., "photo_1.jpg"
	original_filename?: string; // User's original filename
	file_path: string; // e.g., "uploads/users/{id}/photo_1.jpg"
	file_size: number; // Size of the file in bytes
	mime_type: string; // e.g., "image/jpeg"
	is_primary: boolean; // Whether this is the primary photo for the user
	display_order: number; // Order of display (0-4)
	created_at: Date; // Timestamp of when the photo was uploaded
}

export interface User {
	id: string;
	username: string;
	email: string;
	age: number;
	password: string;
	bio?: string;
	first_name: string;
	last_name: string;
	activated: boolean;
	gender: "male" | "female" | "other";
	sexual_orientation: "heterosexual" | "homosexual" | "bisexual";
	location?: {
		type: "Point";
		coordinates: [number, number]; // [longitude, latitude]
	};
	location_manual: boolean;
	fame_rating: number; // 0.0 to 5.0
	profile_complete: boolean;
	last_seen: Date;
	online_status: boolean;
	email_verification_token?: string;
	email_verified_at?: Date;
	password_reset_token?: string;
	password_reset_expires_at?: Date;
	hashtags: string[];
	created_at: Date;
	updated_at: Date;
	photos: UserPhoto[];
	likes_received_count: number; // Number of likes received
	views_count: number; // Number of profile views
	matches_count: number; // Number of matches
}

export interface RegisterUserData {
	username: string;
	email: string;
	age: number;
	password: string;
	first_name: string;
	last_name: string;
	bio?: string;
	gender: "male" | "female" | "other";
	sexual_orientation: "heterosexual" | "homosexual" | "bisexual";
	location?: {
		type: "Point";
		coordinates: [number, number];
	};
	location_manual?: boolean;
}

export interface UserLike {
	id: string;
	liker_id: string;
	liked_id: string;
	is_like: boolean;
	created_at: Date;
}

export interface Match {
	id: string;
	user1_id: string;
	user2_id: string;
	created_at: Date;
}

export interface ProfileView {
	id: string;
	viewer_id: string;
	viewed_id: string;
	created_at: Date;
}

export interface Message {
	id: string;
	match_id: string;
	sender_id: string;
	content: string;
	read_at?: Date;
	created_at: Date;
}

export interface Notification {
	id: string;
	user_id: string;
	type: "like" | "view" | "match" | "unlike" | "message";
	related_user_id: string;
	message?: string;
	read_at?: Date;
	created_at: Date;
}
