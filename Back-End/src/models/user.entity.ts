import type { Photo } from "./photo.entity";

// User entity interface - matches your database schema
export interface User {
	id: string;
	username: string;
	email: string;
	birth_date: Date;
	password: string;
	bio?: string;
	first_name: string;
	last_name: string;
	activated: boolean;
	gender: "male" | "female" | "other";
	sexual_orientation: "heterosexual" | "homosexual" | "bisexual";
	location?:
		| {
				type: "Point";
				coordinates: [number, number]; // [longitude, latitude]
		  }
		| string;
	location_manual: boolean;
	fame_rating: number;
	profile_complete: boolean;
	last_seen: Date;
	online_status: boolean;
	email_verification_token?: string;
	email_verified_at?: Date;
	password_reset_token?: string;
	password_reset_expires_at?: Date;
	hashtags: string[];
	photos: Photo[];
	created_at: Date;
	updated_at: Date;
	// Computed/aggregated fields from database counters
	likes_received_count?: number;
	views_count?: number;
	matches_count?: number;
}

// Types for creating/updating users
export type CreateUserData = Omit<
	User,
	| "id"
	| "created_at"
	| "updated_at"
	| "activated"
	| "profile_complete"
	| "fame_rating"
	| "last_seen"
	| "online_status"
	| "photos"
	| "hashtags"
>;

export type UpdateUserData = Partial<Omit<User, "id" | "created_at" | "updated_at">>;

export type RegisterUserData = {
	username: string;
	email: string;
	password: string;
	first_name: string;
	last_name: string;
	birth_date: Date;
	bio?: string;
	gender: "male" | "female" | "other";
	sexual_orientation: "heterosexual" | "homosexual" | "bisexual";
	location?: {
		type: "Point";
		coordinates: [number, number];
	};
	location_manual?: boolean;
};

// Additional interfaces from user.types.ts
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
