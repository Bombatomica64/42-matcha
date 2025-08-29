// /**
//  * Example: How to use the improved BaseRepository with configuration
//  * This shows how to update your existing repositories to use the new constructor
//  */

// import type { Pool } from "pg";
// import { BaseRepository } from "@orm/base-repository";
// import type { User } from "@models/user.entity";
// import type { Photo } from "@models/photo.entity";

// // Example 1: User Repository with full configuration
// export class UserRepository extends BaseRepository<User> {
// 	constructor(pool: Pool) {
// 		super(pool, {
// 			tableName: "users",
// 			primaryKey: "id", // default
// 			autoManagedColumns: ["id", "created_at", "updated_at", "photos", "hashtags"],
// 			defaultTextFields: ["first_name", "last_name", "username", "bio"],
// 			defaultOrderBy: "created_at",
// 			defaultOrderDirection: "DESC"
// 		});
// 	}

// 	// Your existing custom methods stay the same
// 	async findByIdWithDetails(_id: string): Promise<User | null> {
// 		// ... existing implementation
// 		return null; // placeholder
// 	}
// }

// // Example 2: Photo Repository with minimal configuration
// export class PhotoRepository extends BaseRepository<Photo> {
// 	constructor(pool: Pool) {
// 		super(pool, {
// 			tableName: "user_photos",
// 			// Uses defaults: primaryKey: "id", autoManagedColumns: ["id", "created_at", "updated_at"]
// 			defaultTextFields: ["filename", "original_filename"],
// 			defaultOrderBy: "display_order"
// 		});
// 	}
// }

// // Example 3: Hashtag Repository with custom primary key
// export class HashtagRepository extends BaseRepository<{ id: number; name: string }> {
// 	constructor(pool: Pool) {
// 		super(pool, {
// 			tableName: "hashtags",
// 			primaryKey: "id",
// 			autoManagedColumns: ["id"], // Only ID is auto-managed for hashtags
// 			defaultTextFields: ["name"],
// 			defaultOrderBy: "name",
// 			defaultOrderDirection: "ASC"
// 		});
// 	}
// }

// // Example 4: Legacy compatibility - minimal changes to existing repositories
// export class LegacyUserRepository extends BaseRepository<User> {
// 	constructor(pool: Pool) {
// 		// Just change from super(pool, "users") to:
// 		super(pool, { tableName: "users" });
// 		// Everything else works the same!
// 	}
// }

// /**
//  * Benefits of the new configuration approach:
//  *
//  * 1. **Cleaner constructor**: All configuration in one place
//  * 2. **Smart defaults**: Text fields automatically used in search
//  * 3. **Flexible primary keys**: Support for different ID column names
//  * 4. **Auto-managed columns**: Prevents accidental updates to system fields
//  * 5. **Default ordering**: Consistent sorting across your app
//  * 6. **Better type safety**: Null check fixes for rowCount
//  * 7. **Less boilerplate**: Don't need to specify text fields every time
//  */

// // Usage examples showing the improved experience:

// async function exampleUsage() {
// 	const pool = {} as Pool; // Your pool instance
// 	const userRepo = new UserRepository(pool);

// 	// Search automatically uses configured text fields
// 	const users = await userRepo.search({ first_name: "John" });
// 	// Uses ILIKE on first_name because it's in defaultTextFields

// 	// Pagination automatically uses default ordering
// 	const paginatedUsers = await userRepo.findAllPaginated(
// 		{ page: 1, limit: 10, order: "desc" },
// 		"/api/users"
// 	);
// 	// Orders by created_at DESC by default

// 	// Create automatically filters out auto-managed columns
// 	const newUser = await userRepo.create({
// 		first_name: "John",
// 		id: "should-be-ignored", // This gets filtered out
// 		created_at: new Date(), // This gets filtered out too
// 	});

// 	// Update automatically filters out auto-managed columns
// 	const updated = await userRepo.update("user-id", {
// 		first_name: "Jane",
// 		updated_at: new Date(), // This gets filtered out
// 	});
// }
