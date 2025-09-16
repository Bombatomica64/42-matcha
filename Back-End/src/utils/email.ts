import crypto from "node:crypto";
import process from "node:process";
import { env } from "@config/env";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type StreamTransport from "nodemailer/lib/stream-transport";
import { logger } from "../server";

/**
 * Email service for sending various types of emails
 */
export class EmailService {
	private transporter: Transporter;

	constructor(private baseUrl: string = env.CORS_ORIGIN) {
		// Use a stub transport in test to avoid external SMTP and flakiness
		if (env.NODE_ENV === "test") {
			const options: StreamTransport.Options = {
				streamTransport: true,
				newline: "unix",
				buffer: true,
			};
			this.transporter = nodemailer.createTransport(options);
		} else {
			const options: SMTPTransport.Options = {
				host: process.env.EMAIL_HOST,
				port: Number(process.env.EMAIL_PORT),
				auth: {
					user: process.env.EMAIL_USER,
					pass: process.env.EMAIL_API_PSW, // Fixed: use existing env var
				},
			};
			this.transporter = nodemailer.createTransport(options);
		}
	}

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
			const verificationLink = `${this.baseUrl}/auth/verifyEmail?token=${token}`;

			const ret = await this.transporter.sendMail({
				from: process.env.EMAIL_FROM,
				to: email,
				subject: "Verify your Matcha account",
				html: `<p>Please verify your email by clicking the link below:</p>
                        <a href="${verificationLink}">Verify Email</a>`,
			});

			type SendInfo = { accepted?: string[]; rejected?: string[] };
			const info = ret as unknown as SendInfo;
			if (info.accepted?.length && info.accepted.length > 0 || env.NODE_ENV === "test")
				logger.info(`Verification email sent to ${email}`);
			else logger.error(`Failed to send verification email to ${email}: ${info.rejected?.join(", ")}`);
		} catch (error) {
			logger.error(`Error sending verification email to ${email}: ${error}`);
			// In test, don't fail user registration due to email issues
			if (env.NODE_ENV !== "test") {
				throw new Error("Failed to send verification email");
			}
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

			type SendInfo = { accepted?: string[]; rejected?: string[] };
			const info = ret as unknown as SendInfo;
			if (info.accepted?.length && info.accepted.length > 0 || env.NODE_ENV === "test")
				logger.info(`Password reset email sent to ${email}`);
			else
				logger.error(`Failed to send password reset email to ${email}: ${info.rejected?.join(", ")}`);
		} catch (error) {
			logger.error(`Error sending password reset email to ${email}: ${error}`);
			if (env.NODE_ENV !== "test") {
				throw new Error("Failed to send password reset email");
			}
		}
	}
}

// Export a singleton instance
export const emailService = new EmailService();
