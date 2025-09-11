/**
 * Extended types for better TypeScript support
 * This file provides generic variants of the generated OpenAPI types
 */

// Re-export the generated types
export * from "@generated/typescript/api-nonextended";

import type { components } from "@generated/typescript/api";

// Generic pagination response type
export interface PaginatedResponse<T> {
	data: T[];
	meta: components["schemas"]["PaginationMeta"];
	links: components["schemas"]["PaginationLinks"];
}

// Type aliases for commonly used pagination types
export type PaginationRequest = components["schemas"]["PaginationQuery"];
