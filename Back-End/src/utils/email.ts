import crypto from "node:crypto";
import process from "node:process";
import nodemailer from "nodemailer";
import { logger } from "../server";

/**
 * Email service for sending various types of emails
 */
export class EmailService {
	constructor(private baseUrl: string = "https://matcha.bombatomica64.dev/") {} //TODO ADD TO ENV
	private transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: Number(process.env.EMAIL_PORT),
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_API_PSW, // Fixed: use existing env var
		},
	});

	/**
	 * Generate a secure verification token
	 */
	generateVerificationToken(): string {
		return crypto.randomUUID();
	}

	/**
	 * Send email verification link
	 */
	async sendVerificationEmail(email: string, token: string): Promise<void> {
		try {
			const verificationLink = `${this.baseUrl}auth/verifyEmail?token=${token}`;

			const ret = await this.transporter.sendMail({
				from: process.env.EMAIL_FROM,
				to: email,
				subject: "Verify your Matcha account",
				html: `<p>Please verify your email by clicking the link below:</p>
                        <a href="${verificationLink}">Verify Email</a>`,
			});

			if (ret.accepted.length > 0) logger.info(`Verification email sent to ${email}`);
			else
				logger.error(`Failed to send verification email to ${email}: ${ret.rejected.join(", ")}`);
		} catch (error) {
			logger.error(`Error sending verification email to ${email}: ${error}`);
			throw new Error("Failed to send verification email");
		}
	}

	/**
	 * Send password reset email
	 */
	async sendPasswordResetEmail(email: string, token: string): Promise<void> {
		try {
			const resetLink = `${this.baseUrl}/auth/resetPassword?token=${token}`;

			const ret = await this.transporter.sendMail({
				from: process.env.EMAIL_FROM,
				to: email,
				subject: "Reset your Matcha password",
				html: `<p>Please reset your password by clicking the link below:</p>
        <a href="${resetLink}">Reset Password</a>`,
			});

			if (ret.accepted.length > 0) logger.info(`Password reset email sent to ${email}`);
			else
				logger.error(`Failed to send password reset email to ${email}: ${ret.rejected.join(", ")}`);
		} catch (error) {
			logger.error(`Error sending password reset email to ${email}: ${error}`);
			throw new Error("Failed to send password reset email");
		}
	}
}

// Export a singleton instance
export const emailService = new EmailService();
