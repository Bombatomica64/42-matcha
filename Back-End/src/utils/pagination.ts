/**
 * Pagination utility functions for creating standardized paginated responses
 * This works with the generated API types from OpenAPI schema
 */

import type { components, PaginatedResponse } from "@generated/typescript/api";

/**
 * Create a complete paginated response using generated types
 */
export function createPaginatedResponse<T>(
	data: T[],
	totalItems: number,
	page: number,
	limit: number,
	baseUrl: string,
	queryParams: Record<string, string | number> = {},
): PaginatedResponse<T> {
	const totalPages = Math.ceil(totalItems / limit);

	// Build pagination metadata
	const meta: components["schemas"]["PaginationMeta"] = {
		total_items: totalItems,
		total_pages: totalPages,
		current_page: page,
		per_page: limit,
		has_previous: page > 1,
		has_next: page < totalPages,
	};

	// Build pagination links
	const buildUrl = (pageNum: number) => {
		const params = new URLSearchParams();
		params.set("page", pageNum.toString());
		params.set("limit", limit.toString());

		// Add other query parameters
		Object.entries(queryParams).forEach(([key, value]) => {
			if (key !== "page" && key !== "limit") {
				params.set(key, value.toString());
			}
		});

		return `${baseUrl}?${params.toString()}`;
	};

	const links: components["schemas"]["PaginationLinks"] = {
		first: buildUrl(1),
		last: buildUrl(totalPages),
		previous: page > 1 ? buildUrl(page - 1) : undefined,
		next: page < totalPages ? buildUrl(page + 1) : undefined,
		self: buildUrl(page),
	};

	return {
		data,
		meta,
		links,
	};
}

/**
 * Calculate pagination parameters from request object
 */
export function calculatePagination(request: { page?: number; limit?: number }): {
	offset: number;
	limit: number;
	page: number;
} {
	const page = Math.max(1, request.page || 1);
	const limit = Math.min(Math.max(1, request.limit || 10), 100); // Max 100 items per page
	const offset = (page - 1) * limit;

	return {
		offset,
		limit,
		page,
	};
}
