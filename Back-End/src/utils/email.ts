import crypto from 'crypto';

/**
 * Email service for sending various types of emails
 */
export class EmailService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a secure verification token
   */
  generateVerificationToken(): string {
    return crypto.randomUUID();
  }

  /**
   * Send email verification link
   * This is a mock implementation that logs the verification link
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `${this.baseUrl}/auth/verify-email?token=${token}`;
    
    // eslint-disable-next-line no-console
    console.log('\n📧 EMAIL VERIFICATION');
    // eslint-disable-next-line no-console
    console.log('='.repeat(50));
    // eslint-disable-next-line no-console
    console.log(`To: ${email}`);
    // eslint-disable-next-line no-console
    console.log(`Subject: Verify your Matcha account`);
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('Click the link below to verify your email address:');
    // eslint-disable-next-line no-console
    console.log(`🔗 ${verificationLink}`);
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('This link will expire in 24 hours.');
    // eslint-disable-next-line no-console
    console.log('='.repeat(50));
    // eslint-disable-next-line no-console
    console.log('');

    // In a real implementation, you would use a service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // 
    // Example with nodemailer:
    // await this.transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: 'Verify your Matcha account',
    //   html: this.getVerificationEmailTemplate(verificationLink)
    // });
  }

  /**
   * Send password reset email
   * This is a mock implementation that logs the reset link
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${this.baseUrl}/auth/reset-password?token=${token}`;
    
    // eslint-disable-next-line no-console
    console.log('\n🔓 PASSWORD RESET');
    // eslint-disable-next-line no-console
    console.log('='.repeat(50));
    // eslint-disable-next-line no-console
    console.log(`To: ${email}`);
    // eslint-disable-next-line no-console
    console.log(`Subject: Reset your Matcha password`);
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('Click the link below to reset your password:');
    // eslint-disable-next-line no-console
    console.log(`🔗 ${resetLink}`);
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('This link will expire in 1 hour.');
    // eslint-disable-next-line no-console
    console.log('If you did not request this, please ignore this email.');
    // eslint-disable-next-line no-console
    console.log('='.repeat(50));
    // eslint-disable-next-line no-console
    console.log('');
  }
}

// Export a singleton instance
export const emailService = new EmailService();
