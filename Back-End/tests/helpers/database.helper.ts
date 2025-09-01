import { Pool, type QueryResult } from 'pg';

let pool: Pool | null = null;

export const getTestPool = async (): Promise<Pool> => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'matcha_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

export const closeTestPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export const clearDatabase = async (): Promise<void> => {
  const testPool = await getTestPool();
  const client = await testPool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Disable foreign key checks temporarily
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Get all table names (excluding system tables)
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    // Truncate all tables
    for (const row of result.rows) {
      await client.query(`TRUNCATE TABLE "${row.tablename}" RESTART IDENTITY CASCADE`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const seedTestData = async (): Promise<void> => {
  const testPool = await getTestPool();
  const client = await testPool.connect();

  try {
    // Hash the test password properly for authentication
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

    // Insert test users with proper hashed passwords and email verification
    await client.query(`
      INSERT INTO users (
        id, email, username, first_name, last_name, 
        password, birth_date, gender, location,
        activated, profile_complete, fame_rating, online_status,
        email_verified_at
      ) VALUES 
      (
        '550e8400-e29b-41d4-a716-446655440000', 'test1@example.com', 'testuser1', 'Test', 'User1',
        $1, '1990-01-01', 'male', ST_Point(2.3522, 48.8566),
        true, true, 3.5, true, CURRENT_TIMESTAMP
      ),
      (
        '550e8400-e29b-41d4-a716-446655440001', 'test2@example.com', 'testuser2', 'Test', 'User2',
        $1, '1992-05-15', 'female', ST_Point(2.3522, 48.8566),
        true, true, 4.0, false, CURRENT_TIMESTAMP
      )
    `, [hashedPassword]);    // Insert test hashtags
    await client.query(`
      INSERT INTO hashtags (name) VALUES 
      ('travel'),
      ('music'),
      ('sports')
    `);
    
    // Get the hashtag IDs for linking
    const hashtagResult = await client.query(`
      SELECT id, name FROM hashtags WHERE name IN ('travel', 'music', 'sports')
    `);
    
    const hashtagMap: { [key: string]: number } = {};
    hashtagResult.rows.forEach((row: { id: number; name: string }) => {
      hashtagMap[row.name] = row.id;
    });
    
    // Link users to hashtags
    await client.query(`
      INSERT INTO user_hashtags (user_id, hashtag_id) VALUES 
      ('550e8400-e29b-41d4-a716-446655440000', $1),
      ('550e8400-e29b-41d4-a716-446655440000', $2),
      ('550e8400-e29b-41d4-a716-446655440001', $3),
      ('550e8400-e29b-41d4-a716-446655440001', $4)
    `, [hashtagMap['travel'], hashtagMap['music'], hashtagMap['music'], hashtagMap['sports']]);
    
  } finally {
    client.release();
  }
};

export const testQuery = async (text: string, params?: unknown[]): Promise<QueryResult> => {
  const testPool = await getTestPool();
  return testPool.query(text, params);
};

/**
 * Create a test user directly in the database for authentication testing
 * This bypasses the email verification requirement
 */
export const createTestUserInDB = async (userData: {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  birthDate: string;
  gender: string;
  bio?: string;
}): Promise<string> => {
  const testPool = await getTestPool();
  const client = await testPool.connect();

  try {
    // Hash the password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Generate a UUID for the user
    const { v4: uuidv4 } = await import('uuid');
    const userId = uuidv4();

    // Insert the user with email verification already done
    await client.query(`
      INSERT INTO users (
        id, email, username, first_name, last_name, 
        password, birth_date, gender, bio,
        activated, profile_complete, email_verified_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        true, true, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `, [
      userId, userData.email, userData.username, 
      userData.firstName, userData.lastName, hashedPassword,
      userData.birthDate, userData.gender, userData.bio || 'Test user bio'
    ]);

    return userId;
  } finally {
    client.release();
  }
};
