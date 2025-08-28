import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import { pool } from "../database";

interface UserData {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	birthDate: Date;
	gender: string;
	sexualOrientation: string;
	bio: string;
	location: {
		lat: number;
		lng: number;
	};
	fameRating: number;
	activated: boolean;
	profileComplete: boolean;
	onlineStatus: boolean;
	lastSeen: Date;
}

interface City {
	name: string;
	lat: number;
	lng: number;
}

// Predefined hashtags for interests
const HASHTAGS = [
	"travel",
	"photography",
	"fitness",
	"music",
	"movies",
	"reading",
	"cooking",
	"hiking",
	"yoga",
	"dancing",
	"art",
	"technology",
	"gaming",
	"sports",
	"fashion",
	"nature",
	"adventure",
	"coffee",
	"wine",
	"food",
	"beach",
	"mountains",
	"running",
	"cycling",
	"swimming",
	"meditation",
	"netflix",
	"concerts",
	"festivals",
	"books",
	"writing",
	"painting",
	"guitar",
	"piano",
	"singing",
	"comedy",
	"theater",
	"museums",
	"history",
	"science",
	"languages",
	"volunteer",
	"charity",
	"dogs",
	"cats",
	"animals",
	"gardening",
	"diy",
	"crafts",
];

// Sample bios
const BIOS = [
	"Adventure seeker who loves exploring new places and trying new foods. Always up for a good conversation over coffee!",
	"Fitness enthusiast and yoga lover. Looking for someone who shares my passion for healthy living and outdoor activities.",
	"Music is my life! I play guitar and love going to concerts. Let's discover new artists together.",
	"Photographer capturing life's beautiful moments. Would love to have a partner to explore the world with.",
	"Bookworm and coffee addict. I enjoy deep conversations about everything and nothing.",
	"Chef by day, Netflix binger by night. I cook with love and laugh often.",
	"Hiking trails and mountain views are my therapy. Looking for someone to share these adventures.",
	"Art lover who enjoys visiting museums and galleries. Creative soul seeking artistic connection.",
	"Tech professional who loves innovation but values real human connections even more.",
	"Travel enthusiast with a bucket list that keeps growing. Next destination: finding my person!",
	"Dancer at heart, always moving to the rhythm of life. Let's dance together!",
	"Wine connoisseur and food lover. I believe the best conversations happen over a good meal.",
	"Runner who finds peace in morning jogs. Looking for someone who shares my active lifestyle.",
	"Movie buff who can quote classics and appreciates indie films. Popcorn dates are the best!",
	"Language learner fascinated by different cultures. Teach me something new!",
	"Animal lover and volunteer at local shelters. Kindness is attractive.",
	"Musician who believes in the power of melody to bring people together.",
	"Outdoor enthusiast who loves camping under the stars. Adventure awaits!",
	"Foodie always searching for the perfect dish. Let's explore the culinary world together.",
	"Mindfulness practitioner finding balance in a busy world. Peace and love.",
];

// Major cities with coordinates (lat, lng)
const CITIES: City[] = [
	{ name: "New York", lat: 40.7128, lng: -74.006 },
	{ name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
	{ name: "Chicago", lat: 41.8781, lng: -87.6298 },
	{ name: "Houston", lat: 29.7604, lng: -95.3698 },
	{ name: "Phoenix", lat: 33.4484, lng: -112.074 },
	{ name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
	{ name: "San Antonio", lat: 29.4241, lng: -98.4936 },
	{ name: "San Diego", lat: 32.7157, lng: -117.1611 },
	{ name: "Dallas", lat: 32.7767, lng: -96.797 },
	{ name: "San Jose", lat: 37.3382, lng: -121.8863 },
	{ name: "Austin", lat: 30.2672, lng: -97.7431 },
	{ name: "Jacksonville", lat: 30.3322, lng: -81.6557 },
	{ name: "San Francisco", lat: 37.7749, lng: -122.4194 },
	{ name: "Columbus", lat: 39.9612, lng: -82.9988 },
	{ name: "Indianapolis", lat: 39.7684, lng: -86.1581 },
	{ name: "Fort Worth", lat: 32.7555, lng: -97.3308 },
	{ name: "Charlotte", lat: 35.2271, lng: -80.8431 },
	{ name: "Seattle", lat: 47.6062, lng: -122.3321 },
	{ name: "Denver", lat: 39.7392, lng: -104.9903 },
	{ name: "Washington DC", lat: 38.9072, lng: -77.0369 },
	{ name: "Boston", lat: 42.3601, lng: -71.0589 },
	{ name: "Nashville", lat: 36.1627, lng: -86.7816 },
	{ name: "Baltimore", lat: 39.2904, lng: -76.6122 },
	{ name: "Oklahoma City", lat: 35.4676, lng: -97.5164 },
	{ name: "Louisville", lat: 38.2527, lng: -85.7585 },
	{ name: "Portland", lat: 45.5152, lng: -122.6784 },
	{ name: "Las Vegas", lat: 36.1699, lng: -115.1398 },
	{ name: "Milwaukee", lat: 43.0389, lng: -87.9065 },
	{ name: "Albuquerque", lat: 35.0844, lng: -106.6504 },
	{ name: "Tucson", lat: 32.2226, lng: -110.9747 },
	{ name: "Fresno", lat: 36.7378, lng: -119.7871 },
	{ name: "Sacramento", lat: 38.5816, lng: -121.4944 },
	{ name: "Kansas City", lat: 39.0997, lng: -94.5786 },
	{ name: "Mesa", lat: 33.4152, lng: -111.8315 },
	{ name: "Atlanta", lat: 33.749, lng: -84.388 },
	{ name: "Colorado Springs", lat: 38.8339, lng: -104.8214 },
	{ name: "Raleigh", lat: 35.7796, lng: -78.6382 },
	{ name: "Omaha", lat: 41.2565, lng: -95.9345 },
	{ name: "Miami", lat: 25.7617, lng: -80.1918 },
	{ name: "Oakland", lat: 37.8044, lng: -122.2712 },
	{ name: "Tulsa", lat: 36.154, lng: -95.9928 },
	{ name: "Minneapolis", lat: 44.9778, lng: -93.265 },
	{ name: "Cleveland", lat: 41.4993, lng: -81.6944 },
	{ name: "Wichita", lat: 37.6872, lng: -97.3301 },
	{ name: "Arlington", lat: 32.7357, lng: -97.1081 },
	{ name: "Tampa", lat: 27.9506, lng: -82.4572 },
	{ name: "New Orleans", lat: 29.9511, lng: -90.0715 },
	{ name: "Honolulu", lat: 21.3099, lng: -157.8581 },
	{ name: "Anaheim", lat: 33.8366, lng: -117.9143 },
	{ name: "Santa Ana", lat: 33.7455, lng: -117.8677 },
];

class UserSeeder {
	private createdUsers: string[] = [];
	private hashtagIds = new Map<string, number>();

	constructor() {
		this.createdUsers = [];
		this.hashtagIds = new Map();
	}

	async initialize(
		count: number = 500,
	): Promise<{ usersCreated: number; hashtagsCreated: number }> {
		try {
			console.log("🔗 Using existing database connection");

			// Create hashtags first
			await this.createHashtags();

			// Create users
			await this.createUsers(count);

			// Create relationships (likes, matches, blocks)
			await this.createRelationships();

			console.log("✅ Seeding completed successfully!");
			console.log(`📊 Created ${this.createdUsers.length} users`);

			return {
				usersCreated: this.createdUsers.length,
				hashtagsCreated: this.hashtagIds.size,
			};
		} catch (error) {
			console.error("❌ Seeding failed:", error);
			throw error;
		}
	}

	async createHashtags(): Promise<void> {
		console.log("🏷️  Creating hashtags...");

		for (const hashtag of HASHTAGS) {
			try {
				await pool.query(
					"INSERT INTO hashtags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id",
					[hashtag],
				);

				// Get the ID whether it was inserted or already existed
				const existingResult = await pool.query("SELECT id FROM hashtags WHERE name = $1", [
					hashtag,
				]);

				this.hashtagIds.set(hashtag, existingResult.rows[0].id);
			} catch (error) {
				console.error(`Error creating hashtag ${hashtag}:`, error);
			}
		}

		console.log(`✅ Created/verified ${this.hashtagIds.size} hashtags`);
	}

	async createUsers(count: number): Promise<void> {
		console.log(`👥 Creating ${count} users...`);
		const saltRounds = 10;
		const defaultPassword = await bcrypt.hash("Password123!", saltRounds);

		// Generate all user data first
		const usersData: UserData[] = [];
		for (let i = 0; i < count; i++) {
			usersData.push(this.generateUserData(defaultPassword));
		}

		// Bulk insert users
		const userIds = await this.bulkInsertUsers(usersData);
		this.createdUsers = userIds;

		console.log(`✅ Bulk inserted ${userIds.length} users`);

		// Bulk insert hashtags and photos
		await this.bulkInsertUserHashtags();
		await this.bulkInsertUserPhotos();
	}

	async bulkInsertUsers(usersData: UserData[]): Promise<string[]> {
		const values: string[] = [];
		const params: (string | Date | number | boolean)[] = [];
		let paramIndex = 1;

		for (const userData of usersData) {
			// Build the location as a literal PostGIS function call
			const locationSql = `ST_SetSRID(ST_MakePoint(${userData.location.lng}, ${userData.location.lat}), 4326)`;

			values.push(`(
				$${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, 
				$${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, 
				$${paramIndex + 8}, ${locationSql},
				$${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}
			)`);

			params.push(
				userData.username,
				userData.email,
				userData.firstName,
				userData.lastName,
				userData.password,
				userData.birthDate,
				userData.gender,
				userData.sexualOrientation,
				userData.bio,
				// Note: location is now a literal SQL function, not a parameter
				userData.fameRating,
				userData.activated,
				userData.profileComplete,
				userData.onlineStatus,
				userData.lastSeen,
			);

			paramIndex += 14; // Now we have 14 parameters instead of 16
		}
		const query = `
			INSERT INTO users (
				username, email, first_name, last_name, password, birth_date,
				gender, sexual_orientation, bio, location, fame_rating,
				activated, profile_complete, online_status, last_seen
			) VALUES ${values.join(", ")}
			RETURNING id
		`;

		const result = await pool.query(query, params);
		return result.rows.map((row) => row.id);
	}

	async bulkInsertUserHashtags(): Promise<void> {
		console.log("🏷️ Bulk inserting user hashtags...");

		const values: string[] = [];
		const params: (string | Date | number | boolean)[] = [];
		let paramIndex = 1;

		for (const userId of this.createdUsers) {
			const hashtagCount = Math.floor(Math.random() * 6) + 3;
			const selectedHashtags = faker.helpers.arrayElements(
				Array.from(this.hashtagIds.keys()),
				hashtagCount,
			);

			for (const hashtagName of selectedHashtags) {
				values.push(`($${paramIndex}, $${paramIndex + 1})`);
				params.push(userId, this.hashtagIds.get(hashtagName) || "");
				paramIndex += 2;
			}
		}

		if (values.length > 0) {
			const query = `
				INSERT INTO user_hashtags (user_id, hashtag_id) 
				VALUES ${values.join(", ")}
				ON CONFLICT DO NOTHING
			`;
			await pool.query(query, params);
		}
	}

	async bulkInsertUserPhotos(): Promise<void> {
		console.log("� Bulk inserting user photos...");

		const values: string[] = [];
		const params: (string | Date | number | boolean)[] = [];
		let paramIndex = 1;

		for (const userId of this.createdUsers) {
			values.push(`(
				$${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3},
				$${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}
			)`);

			params.push(
				userId,
				`photo_${userId}_${Date.now()}.jpg`,
				"profile_picture.jpg",
				`/uploads/photos/photo_${userId}_${Date.now()}.jpg`,
				Math.floor(Math.random() * 2000000) + 500000,
				"image/jpeg",
				true,
				1,
			);

			paramIndex += 8;
		}

		if (values.length > 0) {
			const query = `
				INSERT INTO user_photos (
					user_id, filename, original_filename, file_path,
					file_size, mime_type, is_primary, display_order
				) VALUES ${values.join(", ")}
			`;
			await pool.query(query, params);
		}
	}

	generateUserData(password: string): UserData {
		const gender = faker.helpers.arrayElement(["male", "female", "other"]);
		const sexualOrientation = faker.helpers.arrayElement([
			"heterosexual",
			"homosexual",
			"bisexual",
		]);
		const city = faker.helpers.arrayElement(CITIES);

		// Add some randomness to the exact location
		const latOffset = (Math.random() - 0.5) * 0.2; // ±0.1 degrees
		const lngOffset = (Math.random() - 0.5) * 0.2;

		return {
			username:
				faker.internet
					.username()
					.toLowerCase()
					.replace(/[^a-z0-9_]/g, "") + Math.floor(Math.random() * 1000),
			email: faker.internet.email().toLowerCase(),
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			password: password,
			birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
			gender: gender,
			sexualOrientation: sexualOrientation,
			bio: faker.helpers.arrayElement(BIOS),
			location: {
				lat: city.lat + latOffset,
				lng: city.lng + lngOffset,
			},
			fameRating: parseFloat((Math.random() * 4 + 1).toFixed(1)), // 1.0 to 5.0
			activated: true,
			profileComplete: true,
			onlineStatus: Math.random() < 0.3, // 30% online
			lastSeen: faker.date.recent({ days: 30 }),
		};
	}

	async createRelationships(): Promise<void> {
		console.log("💕 Creating relationships...");

		const userCount = this.createdUsers.length;
		const likesCount = Math.floor(userCount * 2); // Each user likes ~2 others on average
		const matchesCount = Math.floor(userCount * 0.5); // 50% get at least one match
		const blocksCount = Math.floor(userCount * 0.1); // 10% block someone

		// Bulk create likes
		await this.bulkCreateLikes(likesCount);

		// Bulk create matches
		await this.bulkCreateMatches(matchesCount);

		// Bulk create blocks
		await this.bulkCreateBlocks(blocksCount);

		// Bulk create profile views
		await this.bulkCreateProfileViews(Math.floor(userCount * 3));

		console.log("✅ Relationships created successfully!");
	}

	async bulkCreateLikes(count: number): Promise<void> {
		console.log(`👍 Creating ${count} likes...`);

		const values: string[] = [];
		const params: (string | Date | number | boolean)[] = [];
		let paramIndex = 1;

		for (let i = 0; i < count; i++) {
			const likerId = faker.helpers.arrayElement(this.createdUsers);
			const likedId = faker.helpers.arrayElement(this.createdUsers);

			if (likerId !== likedId) {
				values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
				params.push(likerId, likedId, true);
				paramIndex += 3;
			}
		}

		if (values.length > 0) {
			const query = `
				INSERT INTO user_likes (liker_id, liked_id, is_like) 
				VALUES ${values.join(", ")}
				ON CONFLICT DO NOTHING
			`;
			await pool.query(query, params);
		}
	}

	async bulkCreateMatches(count: number): Promise<void> {
		console.log(`💖 Creating ${count} potential matches...`);

		const likeValues: string[] = [];
		const likeParams: (string | Date | number | boolean)[] = [];
		const matchValues: string[] = [];
		const matchParams: (string | Date | number | boolean)[] = [];
		let likeParamIndex = 1;
		let matchParamIndex = 1;

		for (let i = 0; i < count; i++) {
			const user1Id = faker.helpers.arrayElement(this.createdUsers);
			const user2Id = faker.helpers.arrayElement(this.createdUsers);

			if (user1Id !== user2Id) {
				// Add mutual likes
				likeValues.push(`($${likeParamIndex}, $${likeParamIndex + 1}, $${likeParamIndex + 2})`);
				likeValues.push(`($${likeParamIndex + 3}, $${likeParamIndex + 4}, $${likeParamIndex + 5})`);
				likeParams.push(user1Id, user2Id, true, user2Id, user1Id, true);
				likeParamIndex += 6;

				// Add match
				matchValues.push(`($${matchParamIndex}, $${matchParamIndex + 1})`);
				matchParams.push(user1Id, user2Id);
				matchParamIndex += 2;
			}
		}

		// Insert mutual likes
		if (likeValues.length > 0) {
			const likeQuery = `
				INSERT INTO user_likes (liker_id, liked_id, is_like) 
				VALUES ${likeValues.join(", ")}
				ON CONFLICT DO NOTHING
			`;
			await pool.query(likeQuery, likeParams);
		}

		// Insert matches
		if (matchValues.length > 0) {
			const matchQuery = `
				INSERT INTO matches (user1_id, user2_id) 
				VALUES ${matchValues.join(", ")}
				ON CONFLICT DO NOTHING
			`;
			await pool.query(matchQuery, matchParams);
		}
	}

	async bulkCreateBlocks(count: number): Promise<void> {
		console.log(`🚫 Creating ${count} blocks...`);

		const values: string[] = [];
		const params: (string | Date | number | boolean)[] = [];
		let paramIndex = 1;

		for (let i = 0; i < count; i++) {
			const blockerId = faker.helpers.arrayElement(this.createdUsers);
			const blockedId = faker.helpers.arrayElement(this.createdUsers);

			if (blockerId !== blockedId) {
				values.push(`($${paramIndex}, $${paramIndex + 1})`);
				params.push(blockerId, blockedId);
				paramIndex += 2;
			}
		}

		if (values.length > 0) {
			const query = `
				INSERT INTO user_blocks (blocker_id, blocked_id) 
				VALUES ${values.join(", ")}
				ON CONFLICT DO NOTHING
			`;
			await pool.query(query, params);
		}
	}

	async bulkCreateProfileViews(count: number): Promise<void> {
		console.log(`👀 Creating ${count} profile views...`);

		const values: string[] = [];
		const params: (string | Date | number | boolean)[] = [];
		let paramIndex = 1;

		for (let i = 0; i < count; i++) {
			const viewerId = faker.helpers.arrayElement(this.createdUsers);
			const viewedId = faker.helpers.arrayElement(this.createdUsers);

			if (viewerId !== viewedId) {
				values.push(`($${paramIndex}, $${paramIndex + 1})`);
				params.push(viewerId, viewedId);
				paramIndex += 2;
			}
		}

		if (values.length > 0) {
			const query = `
				INSERT INTO profile_views (viewer_id, viewed_id) 
				VALUES ${values.join(", ")}
			`;
			await pool.query(query, params);
		}
	}
}

// Export the seeder function
export async function seedUsers(
	count: number = 500,
): Promise<{ usersCreated: number; hashtagsCreated: number }> {
	const seeder = new UserSeeder();
	return await seeder.initialize(count);
}
