/**
 * Updated user controller using the mapping strategy
 * This shows how to use both database entities and API types cleanly
 */
import type { Request, Response } from 'express';
import type { components } from './api-types';
import { UserRepository } from '../repositories/user.repository';
import { dbUserToApiUser, createPublicUserResponse, createMinimalUserResponse } from '../mappers/user.mapper';
import { pool } from '../database';

const userRepository = new UserRepository(pool);

/**
 * Get current user's profile
 * Returns full user data including private information
 */
export async function getUserProfile(_req: Request, res: Response) {
  try {
    const userId = res.locals.user?.id;
    
    if (!userId) {
      const errorResponse: components['schemas']['ErrorResponse'] = {
        error: 'Unauthorized',
        message: 'User not authenticated'
      };
      return res.status(401).json(errorResponse);
    }
    
    // Use database repository to get user with all relations
    const dbUser = await userRepository.findByIdWithDetails(userId);
    
    if (!dbUser) {
      const errorResponse: components['schemas']['ErrorResponse'] = {
        error: 'User not found',
        message: 'The requested user does not exist'
      };
      return res.status(404).json(errorResponse);
    }
    
    // Convert database user to API user (includes email for own profile)
    const apiUser = dbUserToApiUser(dbUser);
    res.status(200).json(apiUser);
    
  } catch {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Get another user's public profile
 * Returns limited user data excluding private information
 */
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const currentUserId = res.locals.user?.id;
  
  try {
    const dbUser = await userRepository.findByIdWithDetails(id);
    
    if (!dbUser) {
      const errorResponse: components['schemas']['ErrorResponse'] = {
        error: 'User not found',
        message: 'The requested user does not exist'
      };
      return res.status(404).json(errorResponse);
    }
    
    // Check if user is blocked (you'd implement this logic)
    const isBlocked = await checkIfBlocked(currentUserId, id);
    if (isBlocked) {
      const errorResponse: components['schemas']['ErrorResponse'] = {
        error: 'User not found',
        message: 'The requested user does not exist'
      };
      return res.status(404).json(errorResponse);
    }
    
    // Convert to public API response (no email)
    const publicUser = createPublicUserResponse(dbUser, false);
    res.status(200).json(publicUser);
    
  } catch {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Search users with pagination
 * Returns minimal user data for performance
 */
export async function searchUsers(req: Request, res: Response) {
  const currentUserId = res.locals.user?.id;
  const { query, age_min, age_max, page = 1, per_page = 10 } = req.query;
  
  if (!currentUserId) {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Unauthorized',
      message: 'User not authenticated'
    };
    return res.status(401).json(errorResponse);
  }
  
  try {
    // Use repository search with database types
    const searchResult = await userRepository.searchUsers(currentUserId, {
      query: query as string,
      ageMin: age_min ? Number(age_min) : undefined,
      ageMax: age_max ? Number(age_max) : undefined,
      page: Number(page),
      perPage: Number(per_page)
    });
    
    // Convert database users to minimal API responses
    const apiUsers = searchResult.users.map(createMinimalUserResponse);
    
    // Return search result with API users
    const response = {
      ...searchResult,
      users: apiUsers
    };
    
    res.status(200).json(response);
    
  } catch {
    const errorResponse: components['schemas']['ErrorResponse'] = {
      error: 'Search failed',
      message: 'Unable to perform user search'
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Update user profile
 * Accepts API format and converts to database format
 */
// export async function updateUserProfile(req: Request, res: Response) {
//   const userId = res.locals.user?.id;
//   const updateData: RequestBody<'patchUserProfile'> = req.body;
  
//   if (!userId) {
//     const errorResponse: components['schemas']['ErrorResponse'] = {
//       error: 'Unauthorized',
//       message: 'User not authenticated'
//     };
//     return res.status(401).json(errorResponse);
//   }
  
//   try {
//     // Convert API data to database format using mapper
//     const dbUpdateData = {
//       bio: updateData.bio,
//       first_name: updateData.first_name,
//       last_name: updateData.last_name,
//       birth_date: updateData.birth_date ? new Date(updateData.birth_date) : undefined,
//       gender: updateData.gender,
//       sexual_orientation: updateData.sexual_orientation,
//       // Handle location conversion
//       location: updateData.location ? {
//         type: 'Point' as const,
//         coordinates: [updateData.location.longitude || 0, updateData.location.latitude || 0]
//       } : undefined
//     };
    
//     // Update using database repository
//     const updatedDbUser = await userRepository.updateProfile(userId, dbUpdateData);
    
//     if (!updatedDbUser) {
//       const errorResponse: components['schemas']['ErrorResponse'] = {
//         error: 'Update failed',
//         message: 'Unable to update user profile'
//       };
//       return res.status(400).json(errorResponse);
//     }
    
//     // Get full user data with relations
//     const fullDbUser = await userRepository.findByIdWithDetails(userId);
    
//     if (!fullDbUser) {
//       const errorResponse: components['schemas']['ErrorResponse'] = {
//         error: 'User not found',
//         message: 'Updated user not found'
//       };
//       return res.status(404).json(errorResponse);
//     }
    
//     // Convert back to API format and return
//     const apiUser = dbUserToApiUser(fullDbUser);
//     res.status(200).json(apiUser);
    
//   } catch {
//     const errorResponse: components['schemas']['ErrorResponse'] = {
//       error: 'Internal server error',
//       message: 'An unexpected error occurred'
//     };
//     res.status(500).json(errorResponse);
//   }
// }

// Helper function (implement this based on your blocking logic)
declare function checkIfBlocked(userId: string | undefined, targetId: string): Promise<boolean>;
