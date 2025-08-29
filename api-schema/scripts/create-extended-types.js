#!/usr/bin/env node

/**
 * Script to create extended TypeScript types with proper generics
 * This creates api.ts with generic PaginatedResponse from api-nonextended.ts
 */

const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../generated/typescript/api.ts');

const extendedTypesContent = `/**
 * Extended API Types with Generic Support
 * 
 * This file provides improved TypeScript types for the OpenAPI schema.
 * The main improvement is a generic PaginatedResponse<T> type.
 * 
 * Auto-generated from OpenAPI schema - DO NOT EDIT MANUALLY
 */

// Re-export all original types
export * from "./api-nonextended";

// Import components for type construction
import type { components } from "./api-nonextended";

// Generic pagination response type - THE MAIN FIX!
export interface PaginatedResponse<T> {
  data: T[];
  meta: components["schemas"]["PaginationMeta"];
  links: components["schemas"]["PaginationLinks"];
}

// Convenient type aliases for common entities
export type User = components["schemas"]["User"];
export type Photo = components["schemas"]["Photo"]; 
export type Hashtag = components["schemas"]["Hashtag"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];

// Specific paginated response types
export type PaginatedUsers = PaginatedResponse<User>;
export type PaginatedPhotos = PaginatedResponse<Photo>;
export type PaginatedHashtags = PaginatedResponse<Hashtag>;

// Authentication types
export type LoginRequest = components["schemas"]["LoginRequest"];
export type LoginResponse = components["schemas"]["LoginResponse"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type RegisterResponse = components["schemas"]["RegisterResponse"];

// Utility type for extracting response types
export type ApiOperation<T> = T extends { 
  responses: { 200: { content: { 'application/json': infer R } } } 
} ? R : never;

// Type guards for runtime type checking
export const isPaginatedResponse = <T>(obj: unknown): obj is PaginatedResponse<T> => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'data' in obj &&
    'meta' in obj &&
    'links' in obj &&
    Array.isArray((obj as PaginatedResponse<T>).data)
  );
};

export const isErrorResponse = (obj: unknown): obj is ErrorResponse => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'error' in obj &&
    'message' in obj &&
    typeof (obj as ErrorResponse).error === 'string' &&
    typeof (obj as ErrorResponse).message === 'string'
  );
};

// Helper function to create paginated responses
export const createPaginatedResponse = <T>(
  data: T[],
  meta: components["schemas"]["PaginationMeta"],
  links: components["schemas"]["PaginationLinks"]
): PaginatedResponse<T> => ({
  data,
  meta,
  links
});
`;

try {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the extended types file
  fs.writeFileSync(outputPath, extendedTypesContent, 'utf8');
  
  console.log('✅ Extended types generated successfully at:', outputPath);
} catch (error) {
  console.error('❌ Error generating extended types:', error);
  process.exit(1);
}
