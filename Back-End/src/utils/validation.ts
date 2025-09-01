/**
 * Validation utilities for input validation
 */
export const ValidationSchemas = {
	validateEmail: (email: string): boolean => {
		// Email validation that prevents consecutive dots but allows other valid characters
		// Checks for: no consecutive dots (..), no leading/trailing dots in local part
		const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9]|[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
		
		// Additional check to prevent consecutive dots
		if (email.includes('..')) {
			return false;
		}
		
		return emailRegex.test(email);
	},

	validatePassword: (password: string): boolean => {
		// At least 8 characters, 1 uppercase, 1 lowercase, 1 number
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
		return passwordRegex.test(password);
	},

	validateUsername: (username: string): boolean => {
		// 3-20 characters, alphanumeric and underscore only
		const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
		return usernameRegex.test(username);
	},
};
