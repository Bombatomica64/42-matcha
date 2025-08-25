import type { Request, Response } from 'express';
import { logger } from '../server';
import type { AuthService } from '@services/auth.services';
import { ValidationSchemas } from '@utils/validation';
import type {
	RegisterRequest,
	RegisterResponse,
	LoginRequest,
	LoginResponse,
	ErrorResponse
} from '@generated/types';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Handle user registration
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterRequest = req.body;

      // Validate required fields
      if (
        !registerData.username ||
        !registerData.email ||
        !registerData.password ||
        !registerData.first_name ||
        !registerData.last_name ||
        !registerData.birth_date ||
        !registerData.gender ||
        !registerData.sexual_orientation
      ) {
        const errorResponse: ErrorResponse = {
          message: 'Missing required fields',
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate email format
      if (!ValidationSchemas.validateEmail(registerData.email)) {
        const errorResponse: ErrorResponse = {
          message: 'Invalid email format',
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate password strength
      if (!ValidationSchemas.validatePassword(registerData.password)) {
        const errorResponse: ErrorResponse = {
          message:
            'Password must be at least 8 characters with uppercase, lowercase, and number',
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate username format
      if (!ValidationSchemas.validateUsername(registerData.username)) {
        const errorResponse: ErrorResponse = {
          message:
            'Username must be 3-20 characters, alphanumeric and underscore only',
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Convert API request to service data
      const userData = {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        birth_date: registerData.birth_date,
        bio: registerData.bio,
        gender: registerData.gender,
        sexual_orientation: registerData.sexual_orientation,
        location: registerData.location?.lat && registerData.location?.lng ? {
          type: 'Point' as const,
          coordinates: [registerData.location.lng, registerData.location.lat] as [number, number]
        } : undefined,
        location_manual: registerData.location_manual ?? false
      };

      // Register user using service
      const newUser = await this.authService.registerUser(userData);

      const successResponse: RegisterResponse = {
        message: 'User registered successfully',
        user_id: newUser.id
      };

      res.status(201).json(successResponse);
    } catch (error) {
      logger.error('Registration error:', error);

      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Registration failed'
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * Handle user login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;

      if (!loginData.email_or_username || !loginData.password) {
        const errorResponse: ErrorResponse = {
          message: 'Email/username and password are required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.authService.loginUser(
        loginData.email_or_username,
        loginData.password
      );

      if (!result) {
        const errorResponse: ErrorResponse = {
          message: 'Invalid credentials'
        };
        res.status(401).json(errorResponse);
        return;
      }

      const successResponse: LoginResponse = {
        message: 'Login successful',
        token: result.token,
        user_id: result.user.id
      };

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Login error:', error);

      const errorResponse: ErrorResponse = {
        message: error instanceof Error ? error.message : 'Login failed'
      };

      res.status(401).json(errorResponse);
    }
  }

  /**
   * Handle user logout
   */
  async logout(_req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement JWT token blacklisting if needed
      res.status(200).json({
        message: 'User logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);

      const errorResponse: ErrorResponse = {
        message: 'Logout failed'
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Handle email verification
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        const errorResponse: ErrorResponse = {
          message: 'Verification token is required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.authService.verifyEmail(token);

      if (!result) {
        const errorResponse: ErrorResponse = {
          message: 'Invalid or expired verification token'
        };
        res.status(400).json(errorResponse);
        return;
      }

      res.status(200).json({
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification error:', error);

      const errorResponse: ErrorResponse = {
        message: 'Email verification failed'
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * Handle password reset request
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        const errorResponse: ErrorResponse = {
          message: 'Email is required'
        };
        res.status(400).json(errorResponse);
        return;
      }

      await this.authService.requestPasswordReset(email);

      res.status(200).json({
        message: 'Email sent with password reset instructions'
      });
    } catch (error) {
      logger.error('Password reset error:', error);

      const errorResponse: ErrorResponse = {
        message: 'Password reset request failed'
      };

      res.status(400).json(errorResponse);
    }
  }

	/**
	 * Handle password change request
	 */
	async changePassword(req: Request, res: Response): Promise<void> {
		try {
			const { token } = req.query;

			if (!token || typeof token !== 'string') {
				const errorResponse: ErrorResponse = {
					message: 'Password change token is required'
				};
				res.status(400).json(errorResponse);
				return;
			}

			const { newPassword } = req.body;

			if (!newPassword) {
				const errorResponse: ErrorResponse = {
					message: 'New password is required'
				};
				res.status(400).json(errorResponse);
				return;
			}

			const result = await this.authService.resetPassword(token, newPassword);

			if (!result) {
				const errorResponse: ErrorResponse = {
					message: 'Failed to reset password'
				};
				res.status(400).json(errorResponse);
				return;
			}

			res.status(200).json({
				message: 'Password reset successfully'
			});
		} catch (error) {
			logger.error('Password reset error:', error);

			const errorResponse: ErrorResponse = {
				message: 'Password reset failed'
			};

			res.status(500).json(errorResponse);
		}
	}
}