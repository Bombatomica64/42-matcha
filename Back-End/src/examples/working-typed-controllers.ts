/**
 * Working examples of using generated OpenAPI types correctly
 * This shows the exact structure required by your OpenAPI specification
 */
import type { Request, Response, NextFunction } from 'express';
import type { 
  components, 
  operations,
  RequestBody, 
  ResponseBody, 
  TypedRequest 
} from './api-types';

// Example 1: Correct login implementation
export async function login(req: Request, res: Response) {
  const loginData: RequestBody<'userLogin'> = req.body;
  
  try {
    // Note: The OpenAPI spec uses 'email_or_username', not 'email'
    const user = await authenticateUser(loginData.email_or_username, loginData.password);
    
    // Correct response structure from OpenAPI spec
    const response: ResponseBody<'userLogin', 200> = {
      message: 'Login successful',
      token: generateJWT(user.id || ''),
      user_id: user.id || ''
    };
    
    res.status(200).json(response);
  } catch {
    // Handle 401 Unauthorized (the actual error response in OpenAPI spec)
    const errorResponse: ResponseBody<'userLogin', 401> = {
      error: 'Invalid credentials',
      message: 'The provided credentials are incorrect'
    };
    
    res.status(401).json(errorResponse);
  }
}

// Example 2: Correct registration implementation
export async function register(req: Request, res: Response) {
  const registerData: components['schemas']['RegisterRequest'] = req.body;
  
  try {
    if (!isValidEmail(registerData.email)) {
      const errorResponse: components['schemas']['ErrorResponse'] = {
        error: 'Invalid email format',
        message: 'The provided email format is invalid',
        code: 'INVALID_EMAIL'
      };
      return res.status(400).json(errorResponse);
    }
    
    const newUser = await createUser(registerData);
    
    // Correct response structure from OpenAPI spec  
    const successResponse: components['schemas']['RegisterResponse'] = {
      message: 'User registered successfully',
      user_id: newUser.id
    };
    
    res.status(201).json(successResponse);
    
  } catch {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Registration failed',
      message: 'Unable to create user account'
    };
    res.status(500).json(errorResponse);
  }
}

// Example 3: Get user profile (returns User object directly)
export async function getUserProfile(req: TypedRequest<'/users/profile'>, res: Response) {
  try {
    // In a real app, you'd get the user ID from JWT token
    const userId = req.user?.id;
    
    if (!userId) {
      const errorResponse: components['schemas']['ErrorResponse'] = {
        error: 'Unauthorized',
        message: 'User not authenticated'
      };
      return res.status(401).json(errorResponse);
    }
    
    const user = await findUserById(userId);
    
    if (!user) {
      const errorResponse: components['schemas']['ErrorResponse'] = {
        error: 'User not found',
        message: 'The requested user does not exist'
      };
      return res.status(404).json(errorResponse);
    }
    
    // Return user directly (matches OpenAPI spec)
    res.status(200).json(user);
    
  } catch {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    };
    res.status(500).json(errorResponse);
  }
}

// Example 4: Search users with query parameters
export async function searchUsers(req: TypedRequest<'/users/search'>, res: Response) {
  const { query, age_min, age_max, page = 1 } = req.query;
  
  try {
    const searchResults = await performUserSearch({
      query,
      ageMin: age_min,
      ageMax: age_max,
      page: Number(page)
    });
    
    // Response is array of User objects
    res.status(200).json(searchResults);
    
  } catch {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Search failed',
      message: 'Unable to perform user search'
    };
    res.status(500).json(errorResponse);
  }
}

// Example 5: Using specific operation types for complete type safety
type RegisterOperation = operations['userRegister'];
type RegisterRequestType = RegisterOperation['requestBody']['content']['application/json'];
type RegisterSuccessResponse = RegisterOperation['responses']['201']['content']['application/json'];

export async function detailedRegister(req: Request, res: Response) {
  const registerData: RegisterRequestType = req.body;
  
  const newUser = await createUser(registerData);
  
  const successResponse: RegisterSuccessResponse = {
    message: 'Registration successful',
    user_id: newUser.id
  };
  
  res.status(201).json(successResponse);
}

// Example 6: Type-safe middleware
export function validateUserId(req: TypedRequest<'/users/{id}'>, res: Response, next: NextFunction) {
  const { id } = req.params; // Automatically typed as string from OpenAPI spec
  
  if (!isValidUserId(id)) {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Invalid user ID',
      message: 'The provided user ID format is invalid'
    };
    return res.status(400).json(errorResponse);
  }
  
  next();
}

// Example 7: Correct response builders
export function createErrorResponse(
  error: string, 
  message: string, 
  code?: string
): components['schemas']['ErrorResponse'] {
  return {
    error,
    message,
    ...(code && { code })
  };
}

export function createSuccessResponse(data: Record<string, unknown>): components['schemas']['SuccessResponse'] {
  return {
    message: 'Operation successful',
    data
  };
}

// Example 8: Import Express type extensions
import '../types/express-extensions';

// Authentication middleware that adds user to request
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json(createErrorResponse(
      'No token provided',
      'Authorization token is required'
    ));
  }
  
  try {
    const user = verifyJWT(token);
    req.user = user;
    next();
  } catch {
    res.status(401).json(createErrorResponse(
      'Invalid token',
      'The provided token is invalid or expired'
    ));
  }
}

// Helper functions (implement these in your actual code)
declare function authenticateUser(emailOrUsername: string, password: string): Promise<components['schemas']['User']>;
declare function generateJWT(userId: string): string;
declare function verifyJWT(token: string): components['schemas']['User'];
declare function findUserById(id: string): Promise<components['schemas']['User'] | null>;
declare function performUserSearch(params: unknown): Promise<components['schemas']['User'][]>;
declare function createUser(data: RegisterRequestType): Promise<components['schemas']['User']>;
declare function isValidEmail(email: string): boolean;
declare function isValidUserId(id: string): boolean;
