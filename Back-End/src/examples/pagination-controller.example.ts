// import type { Request, Response } from "express";
// import type { PaginationRequest } from "../types/pagination";

// /**
//  * Example controller showing how to use standardized pagination
//  * This is for documentation purposes - shows the pattern to follow
//  */

// /**
//  * Get users with pagination
//  * GET /api/users?page=1&limit=10&sort=created_at&order=desc
//  */
// export async function getUsersExample(req: Request, res: Response) {
// 	try {
// 		const pagination: PaginationRequest = {
// 			page: req.query.page ? parseInt(req.query.page as string) : undefined,
// 			limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
// 			sort: req.query.sort as string,
// 			order: req.query.order as "asc" | "desc",
// 		};

// 		const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;

// 		// Using the repository's paginated method
// 		const result = await userRepository.findAllPaginated(pagination, baseUrl);

// 		res.json(result);
// 	} catch (error) {
// 		console.error("Error:", error);
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// }

// /**
//  * Search users with pagination
//  * GET /api/users/search?query=john&page=1&limit=10&sort=fame_rating&order=desc
//  */
// export async function searchUsersExample(req: Request, res: Response) {
// 	try {
// 		const pagination: PaginationRequest = {
// 			page: req.query.page ? parseInt(req.query.page as string) : undefined,
// 			limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
// 			sort: req.query.sort as string,
// 			order: req.query.order as "asc" | "desc",
// 		};

// 		const searchCriteria = {
// 			first_name: req.query.first_name as string,
// 			gender: req.query.gender as string,
// 			// Add other search criteria
// 		};

// 		// Remove undefined values
// 		Object.keys(searchCriteria).forEach((key) => {
// 			if (searchCriteria[key as keyof typeof searchCriteria] === undefined) {
// 				delete searchCriteria[key as keyof typeof searchCriteria];
// 			}
// 		});

// 		const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;

// 		// const result = await userRepository.searchPaginated(
// 		//   searchCriteria,
// 		//   pagination,
// 		//   baseUrl,
// 		//   { textFields: ['first_name', 'last_name', 'bio'] }
// 		// );

// 		// res.json(result);
// 		res.json({ message: "Example search endpoint" });
// 	} catch (error) {
// 		console.error("Error:", error);
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// }

// /*
// Example API Response:
// {
//   "data": [
//     {
//       "id": "123e4567-e89b-12d3-a456-426614174000",
//       "username": "john_doe",
//       "first_name": "John",
//       "last_name": "Doe",
//       // ... other user fields
//     }
//     // ... more users
//   ],
//   "meta": {
//     "total_items": 150,
//     "total_pages": 15,
//     "current_page": 3,
//     "per_page": 10,
//     "has_previous": true,
//     "has_next": true
//   },
//   "links": {
//     "first": "/api/users?page=1&limit=10&sort=created_at&order=desc",
//     "last": "/api/users?page=15&limit=10&sort=created_at&order=desc",
//     "previous": "/api/users?page=2&limit=10&sort=created_at&order=desc",
//     "next": "/api/users?page=4&limit=10&sort=created_at&order=desc",
//     "self": "/api/users?page=3&limit=10&sort=created_at&order=desc"
//   }
// }
// */
