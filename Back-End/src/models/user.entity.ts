// User entity interface - matches your database schema
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
  gender: 'male' | 'female' | 'other';
  sexual_orientation: 'heterosexual' | 'homosexual' | 'bisexual';
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
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
  created_at: Date;
  updated_at: Date;
}

// Types for creating/updating users
export type CreateUserData = Omit<User, 'id' | 'created_at' | 'updated_at' | 'activated' | 'profile_complete' | 'fame_rating' | 'last_seen' | 'online_status'>;

export type UpdateUserData = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

export type RegisterUserData = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  age: number;
  bio?: string;
  gender: 'male' | 'female' | 'other';
  sexual_orientation: 'heterosexual' | 'homosexual' | 'bisexual';
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  location_manual?: boolean;
};
