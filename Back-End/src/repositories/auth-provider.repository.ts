import type { AuthProvider } from "@models/auth-provider.entity";
import { BaseRepository } from "@orm/base-repository";
import type { Pool } from "pg";

export class AuthProviderRepository extends BaseRepository<AuthProvider> {
  constructor(pool: Pool) {
    super(pool, {
      tableName: "auth_providers",
      primaryKey: "id",
      defaultTextFields: ["key", "name"],
      defaultOrderBy: "id",
      defaultOrderDirection: "ASC",
    });
  }

  async findByKey(key: string): Promise<AuthProvider | null> {
    return this.findOneBy({ key } as Partial<AuthProvider>);
  }
}
