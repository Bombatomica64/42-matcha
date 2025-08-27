import type { Request, Response } from 'express';
import { logger } from '../server';
import type { UserService } from '@services/user.services';

export class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	public async getSelf(_req: Request, res: Response): Promise<Response> {
		const userId = res.locals?.user?.id;

		if (!userId) {
			return res.status(401).json({ message: 'Unauthorized' });
		}

		try {
			const user = await this.userService.getUserById(userId);

			if (!user) {
				return res.status(404).json({ message: 'User not found' });
			}

			return res.json(user);
		} catch (error) {
			logger.error(`Failed to get self user: ${userId}`, error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	/**
	 * Get user by ID
	 */
	public async getUserById(req: Request, res: Response): Promise<void> {
		const { id } = req.params;

		try {
			const user = await this.userService.getUserById(id);

			if (!user) {
				res.status(404).json({ message: 'User not found' });
				return;
			}

			res.json(user);
		} catch (error) {
			logger.error(`Failed to get user by ID: ${id}`, error);
			res.status(500).json({ message: 'Internal server error' });
		}
	}
}