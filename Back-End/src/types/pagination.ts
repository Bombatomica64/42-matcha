/**
 * Standard pagination request parameters
 */
export interface PaginationRequest {
  page?: number;      // Page number (1-based, default: 1)
  limit?: number;     // Items per page (default: 10, max: 100)
  sort?: string;      // Sort field
  order?: 'asc' | 'desc'; // Sort direction (default: 'desc')
}

/**
 * Standard pagination response metadata
 */
export interface PaginationMeta {
  total_items: number;      // Total number of items
  total_pages: number;      // Total number of pages
  current_page: number;     // Current page number
  per_page: number;         // Items per page
  has_previous: boolean;    // Whether there's a previous page
  has_next: boolean;        // Whether there's a next page
}

/**
 * Standard pagination links
 */
export interface PaginationLinks {
  first: string;      // First page URL
  last: string;       // Last page URL
  previous?: string;  // Previous page URL (null if first page)
  next?: string;      // Next page URL (null if last page)
  self: string;       // Current page URL
}

/**
 * Complete paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

/**
 * Internal pagination calculation helper
 */
export interface PaginationParams {
  offset: number;
  limit: number;
  page: number;
}

/**
 * Pagination configuration constants
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_ORDER: 'desc' as const,
} as const;

/**
 * Calculate pagination parameters from request
 */
export function calculatePagination(request: PaginationRequest): PaginationParams {
  const page = Math.max(1, request.page || PAGINATION_CONFIG.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, request.limit || PAGINATION_CONFIG.DEFAULT_LIMIT),
    PAGINATION_CONFIG.MAX_LIMIT
  );
  const offset = (page - 1) * limit;

  return { offset, limit, page };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  totalItems: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    total_items: totalItems,
    total_pages: totalPages,
    current_page: page,
    per_page: limit,
    has_previous: page > 1,
    has_next: page < totalPages,
  };
}

/**
 * Build pagination links
 */
export function buildPaginationLinks(
  baseUrl: string,
  page: number,
  totalPages: number,
  queryParams: Record<string, string | number> = {}
): PaginationLinks {
  const buildUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    
    // Add other query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (key !== 'page') {
        params.set(key, value.toString());
      }
    });

    return `${baseUrl}?${params.toString()}`;
  };

  return {
    first: buildUrl(1),
    last: buildUrl(totalPages),
    previous: page > 1 ? buildUrl(page - 1) : undefined,
    next: page < totalPages ? buildUrl(page + 1) : undefined,
    self: buildUrl(page),
  };
}

/**
 * Create a complete paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  limit: number,
  baseUrl: string,
  queryParams: Record<string, string | number> = {}
): PaginatedResponse<T> {
  const meta = buildPaginationMeta(totalItems, page, limit);
  const links = buildPaginationLinks(baseUrl, page, meta.total_pages, queryParams);

  return {
    data,
    meta,
    links,
  };
}
