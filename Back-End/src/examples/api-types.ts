/**
 * Re-export and organize API types for easier usage throughout the application
 */
import type { components, operations, paths } from "@generated/typescript/api";

// Re-export base types
export type { components, operations, paths };

// Re-export TypedRequest from route-types
export type { TypedRequest } from "../types/route-types";

// Core schema types
export type ErrorResponse = components["schemas"]["ErrorResponse"];
export type SuccessResponse = components["schemas"]["SuccessResponse"];

// Auth types
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type RegisterResponse = components["schemas"]["RegisterResponse"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type LoginResponse = components["schemas"]["LoginResponse"];
export type LogoutResponse = components["schemas"]["LogoutResponse"];

// User types
export type User = components["schemas"]["User"];
export type UserProfilePatchRequest = components["schemas"]["UserProfilePatchRequest"];

// Photo types
export type Photo = components["schemas"]["Photo"];
export type PhotoUploadRequest = components["schemas"]["PhotoUploadRequest"];
export type PhotoResponse = components["schemas"]["PhotoResponse"];
export type PhotoListResponse = components["schemas"]["PhotoListResponse"];

// Operation types for type-safe API handling
export type UserRegisterOperation = operations["userRegister"];
export type UserLoginOperation = operations["userLogin"];
export type GetUserProfileOperation = operations["getUserProfile"];

// Path types for route validation
export type ApiPaths = paths;

// Helper types for extracting request/response types from operations
export type RequestBody<T extends keyof operations> = operations[T] extends {
	requestBody: { content: { "application/json": infer R } };
}
	? R
	: never;

export type ResponseBody<
	T extends keyof operations,
	Status extends keyof operations[T]["responses"],
> = operations[T]["responses"][Status] extends { content: { "application/json": infer R } }
	? R
	: never;

// Example usage:
// type RegisterRequestBody = RequestBody<'userRegister'>;
// type RegisterSuccessResponse = ResponseBody<'userRegister', 201>;
