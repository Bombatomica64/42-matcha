// /**
//  * Example: How to use the generic PaginatedResponse<T>
//  *
//  * This shows you exactly how to import and use the types
//  */

// // 1. Import the generic types
// import type { PaginatedResponse, PaginatedUsers, User } from "../types/api";

// // 2. Use in function signatures
// export async function searchUsers(req: any, res: any): Promise<void> {
// 	// Method 1: Use the generic type directly
// 	const result: PaginatedResponse<User> = await userRepository.searchUsers(req.user.id, req.query);

// 	// Method 2: Use the convenient alias
// 	const result2: PaginatedUsers = await userRepository.searchUsers(req.user.id, req.query);

// 	// Both are equivalent and now TypeScript knows:
// 	// - result.data is User[]
// 	// - result.meta has all pagination metadata
// 	// - result.links has pagination URLs

// 	res.json(result);
// }

// // 3. Example for other entities
// async function _getPhotos(): Promise<PaginatedResponse<Photo>> {
// 	// TypeScript will enforce that data is Photo[]
// 	return {
// 		data: [
// 			/* Photo objects */
// 		],
// 		meta: {
// 			total_items: 100,
// 			total_pages: 10,
// 			current_page: 1,
// 			per_page: 10,
// 			has_previous: false,
// 			has_next: true,
// 		},
// 		links: {
// 			first: "/api/photos?page=1",
// 			last: "/api/photos?page=10",
// 			next: "/api/photos?page=2",
// 			self: "/api/photos?page=1",
// 		},
// 	};
// }

// // 4. Frontend usage example
// export async function fetchUsers(page = 1): Promise<PaginatedUsers> {
// 	const response = await fetch(`/api/users/search?page=${page}`);
// 	const data: PaginatedUsers = await response.json();

// 	// TypeScript knows:
// 	// data.data is User[]
// 	// data.meta.total_items is number
// 	// data.links.next is string | undefined

// 	return data;
// }
