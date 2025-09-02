import { ValidationSchemas } from "../../src/utils/validation";

describe("Simple Validation Tests", () => {
	describe("Email Validation", () => {
		it("should validate correct email formats", () => {
			const validEmails = [
				"test@example.com",
				"user.name@domain.co.uk",
				"user+tag@example.org",
				"123@456.com",
			];

			for (const email of validEmails) {
				expect(ValidationSchemas.validateEmail(email)).toBe(true);
			}
		});

		it("should reject invalid email formats", () => {
			const invalidEmails = ["invalid-email", "@domain.com", "user@", "user@domain", ""];

			for (const email of invalidEmails) {
				expect(ValidationSchemas.validateEmail(email)).toBe(false);
			}
		});
	});

	describe("Password Validation", () => {
		it("should validate strong passwords", () => {
			const validPasswords = ["SecurePassword123", "AnotherStrongPass1", "ComplexPass9word"];

			for (const password of validPasswords) {
				expect(ValidationSchemas.validatePassword(password)).toBe(true);
			}
		});

		it("should reject weak passwords", () => {
			const invalidPasswords = [
				"123",
				"password",
				"PASSWORD",
				"12345678",
				"weakpass",
				"NoNumbers",
				"short",
			];

			for (const password of invalidPasswords) {
				expect(ValidationSchemas.validatePassword(password)).toBe(false);
			}
		});
	});

	describe("Username Validation", () => {
		it("should validate correct usernames", () => {
			const validUsernames = ["user123", "test_user", "username", "user_name_123"];

			for (const username of validUsernames) {
				expect(ValidationSchemas.validateUsername(username)).toBe(true);
			}
		});

		it("should reject invalid usernames", () => {
			const invalidUsernames = [
				"ab", // too short
				"a".repeat(21), // too long
				"user-name", // contains dash
				"user.name", // contains dot
				"user name", // contains space
				"user@name", // contains @
			];

			for (const username of invalidUsernames) {
				expect(ValidationSchemas.validateUsername(username)).toBe(false);
			}
		});
	});
});
