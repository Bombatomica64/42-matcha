import bcrypt from "bcrypt";
import { env } from "node:process";

const SALT_ROUNDS =
	parseInt(env.BCRYPT_SALT_ROUNDS ? env.BCRYPT_SALT_ROUNDS : "12") || 12; // Higher = more secure but slower

export const hashPassword = async (password: string): Promise<string> => {
	return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
	password: string,
	hash: string
): Promise<boolean> => {
	return bcrypt.compare(password, hash);
};
