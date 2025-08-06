import { pool } from "../database";
import { RegisterUserData, User } from "../types/user.types";
import { hashPassword, comparePassword } from "../utils/hash";

export class AuthService {
	static async registerUser(
		userData: RegisterUserData
	): Promise<Partial<User>> {
		const hashedPassword = await hashPassword(userData.password);
		if (!hashedPassword) {
			throw new Error("Failed to hash password");
		}
		const query = `INSERT INTO users (username, email, age, password, first_name, last_name, bio, gender, sexual_orientation, location, location_manual) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;
		const values = [
			userData.username,
			userData.email,
			userData.age,
			hashedPassword,
			userData.first_name,
			userData.last_name,
			userData.bio,
			userData.gender,
			userData.sexual_orientation,
			userData.location ?? 4326,
			userData.location_manual ?? false,
		];
		const result = await pool.query(query, values);
		return result.rows[0];
	}

	static async loginUser(
		email: string,
		password: string
	): Promise<Partial<User> | null> {
		const query = `SELECT id, username, email, password, location FROM users WHERE email = $1 AND activated = true`;
		const result = await pool.query(query, [email]);
		if (result.rows.length === 0) {
			return null; // User not found
		}
		const user = result.rows[0];
		const isPasswordValid = await comparePassword(password, user.password);
		if (!isPasswordValid) {
			return null; // Invalid password
		}

		// Return user WITHOUT password hash
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}
}
