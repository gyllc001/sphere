import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../migrations') });
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed (non-fatal):', err);
  } finally {
    // Always close the pool so this process exits and the API server can start.
    // Without this, a failed migration leaves open pg handles and Node never exits.
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Unexpected error in runMigrations:', err);
  process.exit(0); // Non-fatal; let the API server start anyway
});
