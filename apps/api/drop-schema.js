const { Pool } = require('pg');

async function dropSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('Connecting to Supabase...');
    const client = await pool.connect();

    console.log('Dropping public schema...');
    await client.query('DROP SCHEMA public CASCADE');
    console.log('✅ Schema dropped');

    console.log('Creating new public schema...');
    await client.query('CREATE SCHEMA public');
    console.log('✅ Schema created');

    client.release();
    console.log('✅ Schema reset complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

dropSchema();
