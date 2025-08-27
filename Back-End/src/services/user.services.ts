import { pool } from "../database";
import type { User } from "@models/user.entity";
import { UserRepository } from "@repositories/user.repository";

export class UserService {
	private userRepository: UserRepository;

	constructor() {
		this.userRepository = new UserRepository(pool);
	}

	/**
	 * Get selected user by ID
	 */
	public async getUserById(id: string): Promise<User | null> {
		return this.userRepository.findById(id);
	}

}