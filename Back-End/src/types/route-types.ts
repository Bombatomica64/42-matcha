/**
 * Type-safe route definitions using OpenAPI generated types
 * This ensures your Express routes match your OpenAPI specification
 */
import type { paths } from "@generated/typescript/api";
import type { Request } from "express";

// Extract route parameters and query types from paths
type PathParams<T extends keyof paths> = paths[T] extends { parameters: { path: infer P } }
	? P
	: Record<string, string>;
type QueryParams<T extends keyof paths> = paths[T] extends { parameters: { query: infer Q } }
	? Q
	: Record<string, unknown>;

// Type-safe request interfaces
export interface TypedRequest<Path extends keyof paths> extends Omit<Request, "params" | "query"> {
	params: PathParams<Path>;
	query: QueryParams<Path>;
}

// Example usage in controllers:
export type GetUserByIdRequest = TypedRequest<"/users/{id}">;
export type LikeUserRequest = TypedRequest<"/users/{id}/like">;
export type SearchUsersRequest = TypedRequest<"/users/search">;

// Example controller method with type safety:
/*
export async function getUserById(req: GetUserByIdRequest, res: Response) {
  const { id } = req.params; // TypeScript knows this has an 'id' property
  // ... controller logic
}

export async function searchUsers(req: SearchUsersRequest, res: Response) {
  const { query, age_min, age_max, page } = req.query; // All properly typed
  // ... controller logic
}
*/
