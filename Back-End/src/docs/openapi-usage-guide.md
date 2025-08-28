# OpenAPI Generated Types Usage Guide

This guide explains how to use all the generated TypeScript types from your OpenAPI specification.

## 1. Generated Types Structure

Your OpenAPI generation creates several key exports:

```typescript
import type { 
  components,    // All schemas, parameters, responses
  paths,        // Route definitions with parameters/responses  
  operations    // Operation definitions with request/response types
} from '@generated/typescript/api';
```

## 2. Schema Types (components['schemas'])

### Basic Usage
```typescript
// Instead of defining your own types:
type User = components['schemas']['User'];
type LoginRequest = components['schemas']['LoginRequest'];
type ErrorResponse = components['schemas']['ErrorResponse'];
```

### In Controllers
```typescript
import type { components } from '@generated/typescript/api';

export async function login(req: Request, res: Response) {
  const loginData: components['schemas']['LoginRequest'] = req.body;
  
  // Your logic here...
  
  const response: components['schemas']['LoginResponse'] = {
    user: authenticatedUser,
    token: jwtToken
  };
  
  res.json(response);
}
```

## 3. Path Types for Type-Safe Routes

### Route Parameter Typing
```typescript
import type { paths } from '@generated/typescript/api';

// Extract parameter types from specific routes
type UserIdParams = paths['/users/{id}']['get']['parameters']['path'];
// Result: { id: string }

type SearchParams = paths['/users/search']['get']['parameters']['query'];
// Result: { query?: string; age_min?: number; age_max?: number; page?: number }
```

### Type-Safe Request Handlers
```typescript
import { TypedRequest } from '../types/route-types';

export async function getUserById(req: TypedRequest<'/users/{id}'>, res: Response) {
  const { id } = req.params; // TypeScript knows 'id' exists and is a string
  // ... controller logic
}

export async function searchUsers(req: TypedRequest<'/users/search'>, res: Response) {
  const { query, age_min, age_max, page } = req.query; // All properly typed
  // ... controller logic
}
```

## 4. Operations Interface for Complete Type Safety

### Request/Response Type Extraction
```typescript
import type { operations } from '@generated/typescript/api';

// Extract complete operation types
type LoginOperation = operations['login'];
type GetUserOperation = operations['getUser'];

// Extract specific request/response types
type LoginRequestBody = operations['login']['requestBody']['content']['application/json'];
type LoginResponse = operations['login']['responses']['200']['content']['application/json'];
```

### Using Helper Types
```typescript
import { RequestBody, ResponseBody } from '../types/api-types';

// Cleaner syntax for extracting types
type LoginRequest = RequestBody<'login'>;
type LoginSuccessResponse = ResponseBody<'login', 200>;
type LoginErrorResponse = ResponseBody<'login', 400>;
```

## 5. Advanced Usage Patterns

### Validation with Generated Types
```typescript
import type { components } from '@generated/typescript/api';

function validateUserInput(data: unknown): data is components['schemas']['RegisterRequest'] {
  // Your validation logic here
  return typeof data === 'object' && data !== null && 
         'email' in data && 'password' in data;
}
```

### Generic Response Handlers
```typescript
import type { operations } from '@generated/typescript/api';

type ApiResponse<Op extends keyof operations, Status extends keyof operations[Op]['responses']> = 
  operations[Op]['responses'][Status]['content']['application/json'];

// Usage
type UserProfileResponse = ApiResponse<'getUserProfile', '200'>;
type ErrorResponse = ApiResponse<'getUserProfile', '404'>;
```

### Route Registration with Type Safety
```typescript
import type { paths } from '@generated/typescript/api';

type ApiPaths = keyof paths;
type HttpMethods = 'get' | 'post' | 'put' | 'delete' | 'patch';

interface TypedRoute<Path extends ApiPaths, Method extends HttpMethods> {
  path: Path;
  method: Method;
  handler: (req: TypedRequest<Path>, res: Response) => void;
}

// Register routes with compile-time path validation
const routes: TypedRoute<'/users/{id}', 'get'>[] = [
  {
    path: '/users/{id}',
    method: 'get',
    handler: getUserById
  }
];
```

## 6. Middleware with Generated Types

### Authentication Middleware
```typescript
import type { components } from '@generated/typescript/api';

declare global {
  namespace Express {
    interface Request {
      user?: components['schemas']['User'];
    }
  }
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  // Authentication logic...
  req.user = authenticatedUser; // TypeScript knows this is a User type
  next();
}
```

## 7. Best Practices

### 1. Centralized Type Exports
Create a central file (`src/types/api-types.ts`) that re-exports all generated types:

```typescript
export type { components, paths, operations } from '@generated/typescript/api';
export type * from './route-types';

// Helper types for common patterns
export type User = components['schemas']['User'];
export type ErrorResponse = components['schemas']['ErrorResponse'];
```

### 2. Type Guards for Runtime Safety
```typescript
export function isErrorResponse(obj: unknown): obj is components['schemas']['ErrorResponse'] {
  return typeof obj === 'object' && obj !== null && 'error' in obj;
}
```

### 3. Response Builders
```typescript
export function createSuccessResponse<T>(data: T): components['schemas']['SuccessResponse'] & { data: T } {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(message: string): components['schemas']['ErrorResponse'] {
  return {
    success: false,
    error: {
      message,
      timestamp: new Date().toISOString()
    }
  };
}
```

## 8. Integration with Express Router

### Type-Safe Router Factory
```typescript
import { Router } from 'express';
import type { paths } from '@generated/typescript/api';

export function createTypedRouter<Path extends keyof paths>() {
  const router = Router();
  
  return {
    get: (handler: (req: TypedRequest<Path>, res: Response) => void) => {
      router.get('/', handler);
      return router;
    },
    post: (handler: (req: TypedRequest<Path>, res: Response) => void) => {
      router.post('/', handler);
      return router;
    },
    // ... other methods
  };
}
```

This comprehensive type system ensures your backend implementation always matches your OpenAPI specification, providing compile-time safety and excellent developer experience.
