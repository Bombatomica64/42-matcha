import { pool } from './database.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool } from 'pg';

interface MigrationModule { up: (pool: Pool) => Promise<void>; down?: (pool: Pool) => Promise<void>; }

async function ensureMigrationsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);
}

async function getApplied(): Promise<Set<string>> {
  const res = await pool.query('SELECT name FROM _migrations ORDER BY id');
  return new Set(res.rows.map(r => r.name));
}

async function loadMigrations(): Promise<string[]> {
  const dir = join(process.cwd(), 'src', 'migrations');
  const files = await readdir(dir);
  return files
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .sort(); // lexical order = chronological if prefixed with timestamp
}

async function run() {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  await ensureMigrationsTable();
  const applied = await getApplied();
  const files = await loadMigrations();

  if (direction === 'up') {
    for (const file of files) {
      if (applied.has(file)) continue; // skip already applied
      const mod: MigrationModule = await import(join(process.cwd(), 'src', 'migrations', file));
      if (!mod.up) {
        console.warn(`Skipping ${file} (no up export)`);
        continue;
      }
      console.log(`Applying migration: ${file}`);
      await mod.up(pool);
      await pool.query('INSERT INTO _migrations(name) VALUES($1)', [file]);
    }
    console.log('All pending migrations applied.');
  } else {
    // down: rollback the LAST applied migration only (simple strategy)
    const appliedList = [...applied];
    if (!appliedList.length) {
      console.log('No migrations to rollback.');
      return;
    }
    const last = appliedList[appliedList.length - 1];
    const mod: MigrationModule = await import(join(process.cwd(), 'src', 'migrations', last));
    if (!mod.down) {
      console.error(`Migration ${last} has no down; aborting.`);
      return;
    }
    console.log(`Rolling back migration: ${last}`);
    await mod.down(pool);
    await pool.query('DELETE FROM _migrations WHERE name = $1', [last]);
  }
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
