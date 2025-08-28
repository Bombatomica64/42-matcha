// /**
//  * Practical examples of using generated OpenAPI types
//  * This shows working patterns you can apply to your controllers
//  */
// import type { Request, Response, NextFunction } from 'express';
// import type { 
//   components, 
//   operations,
//   RequestBody, 
//   ResponseBody, 
//   TypedRequest 
// } from './api-types';

// // Example 1: Using helper types for login
// export async function loginWithTypes(req: Request, res: Response) {
//   // Type the request body using helper
//   const loginData: RequestBody<'userLogin'> = req.body;
  
//   try {
//     // Your authentication logic here...
//     const user = await authenticateUser(loginData.email, loginData.password);
    
//     // Type-safe response that matches OpenAPI spec
//     const response: ResponseBody<'userLogin', 200> = {
//       user,
//       token: generateJWT(user.id!)
//     };
    
//     res.status(200).json(response);
//   } catch {
//     const errorResponse: ResponseBody<'userLogin', 400> = {
//       error: 'Invalid credentials'
//     };
    
//     res.status(400).json(errorResponse);
//   }
// }

// // Example 2: Direct schema usage
// export async function registerWithSchemas(req: Request, res: Response) {
//   const registerData: components['schemas']['RegisterRequest'] = req.body;
  
//   try {
//     // Validate email format
//     if (!isValidEmail(registerData.email)) {
//       const errorResponse: components['schemas']['ErrorResponse'] = {
//         error: 'Invalid email format'
//       };
//       return res.status(400).json(errorResponse);
//     }
    
//     // Create user
//     const newUser = await createUser(registerData);
    
//     const successResponse: components['schemas']['RegisterResponse'] = {
//       user: newUser,
//       message: 'User registered successfully'
//     };
    
//     res.status(201).json(successResponse);
    
//   } catch {
//     res.status(500).json({
//       error: 'Registration failed'
//     });
//   }
// }

// // Example 3: Type-safe route parameters  
// export async function getUserById(req: TypedRequest<'/users/{id}'>, res: Response) {
//   const { id } = req.params; // TypeScript knows 'id' exists and is a string
  
//   try {
//     const user = await findUserById(id);
    
//     if (!user) {
//       const errorResponse: components['schemas']['ErrorResponse'] = {
//         error: 'User not found'
//       };
//       return res.status(404).json(errorResponse);
//     }
    
//     // Return user directly (matches OpenAPI spec)
//     res.status(200).json(user);
    
//   } catch {
//     res.status(500).json({
//       error: 'Internal server error'
//     });
//   }
// }

// // Example 4: Search with typed query parameters
// export async function searchUsers(req: TypedRequest<'/users/search'>, res: Response) {
//   // All query parameters are properly typed from OpenAPI spec
//   const { query, age_min, age_max, page = 1 } = req.query;
  
//   try {
//     const searchResults = await performUserSearch({
//       query,
//       ageMin: age_min,
//       ageMax: age_max,
//       page: Number(page)
//     });
    
//     // Response is array of User objects
//     const response: components['schemas']['User'][] = searchResults;
//     res.status(200).json(response);
    
//   } catch {
//     res.status(500).json({
//       error: 'Search failed'
//     });
//   }
// }

// // Example 5: Using specific operation types
// type RegisterOperation = operations['userRegister'];
// type RegisterRequestType = RegisterOperation['requestBody']['content']['application/json'];
// type RegisterSuccessResponse = RegisterOperation['responses']['201']['content']['application/json'];

// export async function detailedRegister(req: Request, res: Response) {
//   const registerData: RegisterRequestType = req.body;
  
//   // Type-safe response construction
//   const successResponse: RegisterSuccessResponse = {
//     user: await createUser(registerData),
//     message: 'Registration successful'
//   };
  
//   res.status(201).json(successResponse);
// }

// // Example 6: Type-safe middleware
// export function validateUserId(req: TypedRequest<'/users/{id}'>, res: Response, next: NextFunction) {
//   const { id } = req.params; // Automatically typed as string
  
//   if (!isValidUserId(id)) {
//     return res.status(400).json({
//       error: 'Invalid user ID format'
//     });
//   }
  
//   next();
// }

// // Example 7: Response builders with types
// export function createSuccessResponse<T>(data: T): components['schemas']['SuccessResponse'] & { data: T } {
//   return {
//     success: true,
//     data,
//     timestamp: new Date().toISOString()
//   };
// }

// export function createErrorResponse(message: string): components['schemas']['ErrorResponse'] {
//   return {
//     error: message
//   };
// }

// // Helper functions (you'd implement these in your actual code)
// declare function authenticateUser(email: string, password: string): Promise<components['schemas']['User']>;
// declare function generateJWT(userId: string): string;
// declare function findUserById(id: string): Promise<components['schemas']['User'] | null>;
// declare function performUserSearch(params: unknown): Promise<components['schemas']['User'][]>;
// declare function createUser(data: RegisterRequestType): Promise<components['schemas']['User']>;
// declare function isValidEmail(email: string): boolean;
// declare function isValidUserId(id: string): boolean;
