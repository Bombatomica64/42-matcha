import { env } from "@config/env";
import type { User } from "@models/user.entity";
import { UserRepository } from "@repositories/user.repository";
import { AuthProviderRepository } from "@repositories/auth-provider.repository";
import { UserIdentityRepository } from "@repositories/user-identity.repository";
import { AuthService } from "@services/auth.services";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as SamlStrategy } from "@node-saml/passport-saml";
import passport from "passport";
import { pool } from "../database";
import crypto from "node:crypto";

const userRepository = new UserRepository(pool);
const authProviderRepo = new AuthProviderRepository(pool);
const userIdentityRepo = new UserIdentityRepository(pool);
const authService = new AuthService();

/**
 * Serialize user for session storage
 */
// Use "any" here to avoid coupling to Express.User typing
passport.serializeUser((user: Express.User, done) => {
	// The user object is our domain user; cast to access id safely
	done(null, (user as unknown as User).id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id: string, done) => {
	try {
		const user = await userRepository.findById(id);
		done(null, user);
	} catch (error) {
		done(error, null);
	}
});

/**
 * Google OAuth 2.0 Strategy
 */
passport.use(
	new GoogleStrategy(
		{
			clientID: env.GOOGLE_CLIENT_ID || "",
			clientSecret: env.GOOGLE_CLIENT_SECRET || "",
			callbackURL: env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
		},
	async (_accessToken, _refreshToken, profile, done) => {
			try {
				// Check if user already exists with this Google ID
				const existingUser = await userRepository.findOneBy({ google_id: profile.id } as Partial<User>);

				if (existingUser) {
					// Ensure identity record exists/updated
					const provider = await authProviderRepo.findByKey("google");
					if (provider) {
						await userIdentityRepo.upsertIdentity({
							user_id: existingUser.id,
							provider_id: provider.id,
							provider_user_id: profile.id,
							email: profile.emails?.[0]?.value,
							profile: {
								displayName: profile.displayName,
								name: profile.name,
								photos: profile.photos,
								provider: "google",
							},
						});
					}
					return done(null, existingUser);
				}

				// Check if user exists with this email
				const emailUser = await userRepository.findOneBy({ email: profile.emails?.[0]?.value } as Partial<User>);

				if (emailUser) {
					// Link Google account to existing user
					const updatedUser = await userRepository.update(emailUser.id, {
						google_id: profile.id,
						auth_provider: "google",
					});
					// Create/update identity record
					const provider = await authProviderRepo.findByKey("google");
					if (provider && updatedUser) {
						await userIdentityRepo.upsertIdentity({
							user_id: updatedUser.id,
							provider_id: provider.id,
							provider_user_id: profile.id,
							email: profile.emails?.[0]?.value,
							profile: {
								displayName: profile.displayName,
								name: profile.name,
								photos: profile.photos,
								provider: "google",
							},
						});
					}
					return done(null, updatedUser || false);
				}

				// Create new user from Google profile
				const userData = {
					username: `google_${profile.id}`, // Temporary username - user can change later
					email: profile.emails?.[0]?.value || "",
					first_name: profile.name?.givenName || "",
					last_name: profile.name?.familyName || "",
					birth_date: new Date("1990-01-01"), // Default - user must complete profile
					gender: "other" as const, // Default - user must specify
					sexual_orientation: "bisexual" as const, // allowed by DB constraint; user can change later
					google_id: profile.id,
					auth_provider: "google" as const,
					location_manual: false,
					// generate a random password to satisfy local registration requirements
					password: crypto.randomUUID(),
				};

				const newUser = await authService.registerUser(userData);
				// Create identity record
				const provider = await authProviderRepo.findByKey("google");
				if (provider && newUser) {
					await userIdentityRepo.upsertIdentity({
						user_id: (newUser as unknown as User).id,
						provider_id: provider.id,
						provider_user_id: profile.id,
						email: profile.emails?.[0]?.value,
						profile: {
							displayName: profile.displayName,
							name: profile.name,
							photos: profile.photos,
							provider: "google",
						},
					});
				}
				return done(null, newUser as unknown as User);
			} catch (error) {
				return done(error, false);
			}
		},
	),
);

/**
 * University SAML Strategy
 * This is a generic SAML strategy that can be configured for different universities
 */
if (
	env.UNIVERSITY_SAML_CERT &&
	env.UNIVERSITY_SAML_ENTRY_POINT &&
	env.UNIVERSITY_SAML_ISSUER &&
	env.UNIVERSITY_SAML_CALLBACK_URL
) {
	// Instantiate via any cast to bypass typings arity mismatch between deps
	const samlOptions = {
		entryPoint: env.UNIVERSITY_SAML_ENTRY_POINT,
		issuer: env.UNIVERSITY_SAML_ISSUER,
		callbackUrl: env.UNIVERSITY_SAML_CALLBACK_URL,
		cert: env.UNIVERSITY_SAML_CERT,
		identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
		signatureAlgorithm: "sha256",
		digestAlgorithm: "sha256",
		acceptedClockSkewMs: 60000,
	} as unknown as ConstructorParameters<typeof SamlStrategy>[0];

	const verify = async (
		profile: unknown,
		done: (err: unknown, user?: unknown) => void,
	) => {
		try {
			const p = profile as { email?: string; nameID?: string; uid?: string; firstName?: string; givenName?: string; lastName?: string; surname?: string };
			const email = p.email || p.nameID;
			const universityId = p.nameID || p.uid;

			if (!email || !universityId) {
				return done(new Error("Invalid SAML response: missing email or university ID"), false);
			}

			const existingUser = await userRepository.findOneBy({ university_id: universityId } as Partial<User>);
			if (existingUser) {
				// Ensure identity record exists/updated
				const provider = await authProviderRepo.findByKey("university_saml");
				if (provider) {
					await userIdentityRepo.upsertIdentity({
						user_id: existingUser.id,
						provider_id: provider.id,
						provider_user_id: universityId,
						email: email,
						profile: {
							provider: "saml",
							attributes: p,
						},
					});
				}
				return done(null, existingUser);
			}

			const emailUser = await userRepository.findOneBy({ email } as Partial<User>);
			if (emailUser) {
				const updatedUser = await userRepository.update(emailUser.id, {
					university_id: universityId,
					auth_provider: "university",
				});
				// Create/update identity
				const provider = await authProviderRepo.findByKey("university_saml");
				if (provider && updatedUser) {
					await userIdentityRepo.upsertIdentity({
						user_id: updatedUser.id,
						provider_id: provider.id,
						provider_user_id: universityId,
						email: email,
						profile: {
							provider: "saml",
							attributes: p,
						},
					});
				}
				return done(null, updatedUser || false);
			}

			const userData = {
				username: `uni_${String(universityId).replace(/[^a-zA-Z0-9]/g, "_")}`,
				email,
				first_name: p.firstName || p.givenName || "",
				last_name: p.lastName || p.surname || "",
				birth_date: new Date("1990-01-01"),
				gender: "other" as const,
				sexual_orientation: "bisexual" as const,
				university_id: universityId,
				auth_provider: "university" as const,
				location_manual: false,
				password: crypto.randomUUID(),
			};

			const newUser = await authService.registerUser(userData);
			const provider = await authProviderRepo.findByKey("university_saml");
			if (provider && newUser) {
				await userIdentityRepo.upsertIdentity({
					user_id: (newUser as unknown as User).id,
					provider_id: provider.id,
					provider_user_id: universityId,
					email: email,
					profile: {
						provider: "saml",
						attributes: p,
					},
				});
			}
			return done(null, newUser as unknown);
		} catch (error) {
			return done(error);
		}
	};

	type SamlCtor = new (
		options: ConstructorParameters<typeof SamlStrategy>[0],
		verify: (profile: unknown, done: (err: unknown, user?: unknown) => void) => void,
	) => passport.Strategy;
	const strategy = new (SamlStrategy as unknown as SamlCtor)(
		samlOptions,
		verify,
	) as passport.Strategy;
	passport.use("university-saml", strategy);
}

export default passport;