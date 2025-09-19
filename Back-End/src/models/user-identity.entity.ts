export interface UserIdentity {
  id: string; // uuid
  user_id: string;
  provider_id: number;
  provider_user_id: string;
  email?: string | null;
  profile?: Record<string, unknown> | null;
  created_at: Date;
}

export type CreateUserIdentity = Omit<UserIdentity, "id" | "created_at">;
