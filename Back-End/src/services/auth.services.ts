import { pool } from "../database";
import type { RegisterUserData, User } from "../models/user.entity";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
// TODO: Add JWT utilities when implementing authentication
// import { generateToken } from "../utils/jwt";

export class AuthService {
	private userRepository: UserRepository;

	constructor() {
		this.userRepository = new UserRepository(pool);
	}

	/**
	 * Register a new user
	 */
	async registerUser(userData: RegisterUserData): Promise<Partial<User>> {
		// Check if user already exists
		const existingUser = await this.userRepository.findByEmailOrUsername(userData.email);
		if (existingUser) {
			throw new Error("User with this email already exists");
		}

		const existingUsername = await this.userRepository.findByUsername(userData.username);
		if (existingUsername) {
			throw new Error("Username is already taken");
		}

		// Hash password
		const hashedPassword = await hashPassword(userData.password);
		if (!hashedPassword) {
			throw new Error("Failed to hash password");
		}

		// Create user data with hashed password
		const userDataWithHashedPassword = {
			...userData,
			password: hashedPassword,
			hashtags: [], // Initialize with empty hashtags array
			location_manual: userData.location_manual ?? false
		};

		// Create user
		const newUser = await this.userRepository.createUser(userDataWithHashedPassword);

		// Return user without password
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _, ...userWithoutPassword } = newUser;
		return userWithoutPassword;
	}

	/**
	 * Login user with email/username and password
	 */
	async loginUser(
		emailOrUsername: string,
		password: string
	): Promise<{ user: Partial<User>; token: string } | null> {
		// Find user by email or username
		const user = await this.userRepository.findByEmailOrUsername(emailOrUsername);
		if (!user) {
			return null; // User not found
		}

		// Check if user is activated
		if (!user.activated) {
			throw new Error("Please verify your email before logging in");
		}

		// Verify password
		const isPasswordValid = await comparePassword(password, user.password);
		if (!isPasswordValid) {
			return null; // Invalid password
		}

		// Update user's online status and last seen
		await this.userRepository.updateOnlineStatus(user.id, true);

		// TODO: Generate JWT token
		const token = "temporary-token"; // Replace with actual JWT generation

		// Return user WITHOUT password hash
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _, ...userWithoutPassword } = user;
		
		return {
			user: userWithoutPassword,
			token
		};
	}

	/**
	 * Verify user email with verification token
	 */
	async verifyEmail(token: string): Promise<boolean> {
		// Find user by verification token
		const user = await this.userRepository.findOneBy({ 
			email_verification_token: token 
		} as Partial<User>);

		if (!user) {
			return false; // Invalid token
		}

		// Activate user
		await this.userRepository.activateUser(user.id);

		// Clear verification token
		await this.userRepository.update(user.id, {
			email_verification_token: "00000000-0000-0000-0000-000000000000", // Clear token
		} as Partial<User>);

		return true;
	}

	/**
	 * Request password reset
	 */
	async requestPasswordReset(email: string): Promise<void> {
		const user = await this.userRepository.findByEmail(email);
		if (!user) {
			// Don't reveal if email exists or not for security
			return;
		}

		// Generate reset token (simplified - should use crypto.randomUUID() in real implementation)
		const resetToken = `reset_${Date.now()}_${Math.random()}`;
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

		// Save reset token
		await this.userRepository.update(user.id, {
			password_reset_token: resetToken,
			password_reset_expires_at: expiresAt
		} as Partial<User>);

		// TODO: Send email with reset link
		// await emailService.sendPasswordResetEmail(user.email, resetToken);
	}

	/**
	 * Reset password with token
	 */
	async resetPassword(token: string, newPassword: string): Promise<boolean> {
		// Find user by reset token
		const user = await this.userRepository.findOneBy({
			password_reset_token: token
		} as Partial<User>);

		if (!user || !user.password_reset_expires_at) {
			return false; // Invalid token
		}

		// Check if token is expired
		if (user.password_reset_expires_at < new Date()) {
			return false; // Token expired
		}

		// Hash new password
		const hashedPassword = await hashPassword(newPassword);
		if (!hashedPassword) {
			throw new Error("Failed to hash password");
		}

		// Update password and clear reset token
		await this.userRepository.update(user.id, {
			password: hashedPassword,
			password_reset_token: undefined,
			password_reset_expires_at: undefined
		} as Partial<User>);

		return true;
	}

	/**
	 * Logout user (update online status)
	 */
	async logoutUser(userId: string): Promise<void> {
		await this.userRepository.updateOnlineStatus(userId, false);
	}
}
