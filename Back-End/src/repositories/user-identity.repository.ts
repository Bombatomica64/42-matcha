import type { CreateUserIdentity, UserIdentity } from "@models/user-identity.entity";
import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

export class UserIdentityRepository extends BaseRepository<UserIdentity> {
  constructor(pool: Pool) {
    super(pool, {
      tableName: "user_identities",
      primaryKey: "id",
      defaultTextFields: ["email", "provider_user_id"],
      defaultOrderBy: "created_at",
      defaultOrderDirection: "DESC",
    });
  }

  async upsertIdentity(identity: CreateUserIdentity): Promise<UserIdentity> {
    const query = `
      INSERT INTO user_identities (user_id, provider_id, provider_user_id, email, profile)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (provider_id, provider_user_id)
      DO UPDATE SET user_id = EXCLUDED.user_id, email = EXCLUDED.email, profile = EXCLUDED.profile
      RETURNING *
    `;
    const params = [
      identity.user_id,
      identity.provider_id,
      identity.provider_user_id,
      identity.email ?? null,
      identity.profile ? JSON.stringify(identity.profile) : null,
    ];
    const result = await this.query(query, params);
    return result.rows[0] as UserIdentity;
  }

  async listForUser(userId: string): Promise<Array<UserIdentity & { provider_key: string; provider_name: string }>> {
    const query = `
      SELECT ui.*, ap.key as provider_key, ap.name as provider_name
      FROM user_identities ui
      JOIN auth_providers ap ON ap.id = ui.provider_id
      WHERE ui.user_id = $1
      ORDER BY ui.created_at DESC
    `;
    const result = await this.query(query, [userId]);
    return result.rows as Array<UserIdentity & { provider_key: string; provider_name: string }>;
  }
}
