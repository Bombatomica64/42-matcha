/**
 * API Types - Type-safe API development
 * These types match the OpenAPI schema but with proper TypeScript generics
 */

// Core pagination types
export interface PaginationMeta {
	total_items: number;
	total_pages: number;
	current_page: number;
	per_page: number;
	has_previous: boolean;
	has_next: boolean;
}

export interface PaginationLinks {
	first: string;
	last: string;
	previous?: string;
	next?: string;
	self: string;
}

// Generic PaginatedResponse - THIS IS THE FIX FOR YOUR ISSUE!
export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
	links: PaginationLinks;
}

// User types
export interface User {
	id: string;
	username?: string;
	email: string;
	first_name: string;
	last_name: string;
	birth_date: string;
	bio?: string;
	gender: "male" | "female" | "other";
	sexual_orientation: "heterosexual" | "homosexual" | "bisexual" | "other";
	location?: {
		latitude: number;
		longitude: number;
	};
	fame_rating: number;
	online_status: boolean;
	likes_received: number;
	views: number;
	matches: number;
	photos: Photo[];
	hashtags: string[];
}

export interface Photo {
	id: string;
	user_id: string;
	filename: string;
	original_filename?: string;
	image_url: string;
	file_size?: number;
	mime_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
	is_main: boolean;
	display_order: number;
	uploaded_at: string;
}

export interface Hashtag {
	id: number;
	name: string;
	created_at?: string;
}

export interface ErrorResponse {
	error: string;
	message: string;
	code?: string;
	details?: Record<string, unknown>;
}

// Convenient type aliases for paginated responses
export type PaginatedUsers = PaginatedResponse<User>;
export type PaginatedPhotos = PaginatedResponse<Photo>;
export type PaginatedHashtags = PaginatedResponse<Hashtag>;

// Authentication types
export interface LoginRequest {
	email_or_username: string;
	password: string;
}

export interface LoginResponse {
	message?: string;
	token?: string;
	user_id?: string;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	first_name: string;
	last_name: string;
	birth_date: string;
	bio?: string;
	location: {
		lat: number;
		lng: number;
	};
	location_manual?: boolean;
	sexual_orientation: "heterosexual" | "homosexual" | "bisexual";
	gender: "male" | "female" | "other";
}

export interface RegisterResponse {
	message?: string;
	user_id?: string;
}
