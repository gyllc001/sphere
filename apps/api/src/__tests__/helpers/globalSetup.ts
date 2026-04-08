/**
 * Jest global setup — runs once before all test suites.
 *
 * Responsibilities:
 * - Validate required env vars are present.
 * - (Optional) Run migrations against TEST_DATABASE_URL before the suite.
 */
export default async function globalSetup() {
  const required = ['TEST_DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars for tests: ${missing.join(', ')}.\n` +
        'Copy apps/api/.env.test.example to apps/api/.env.test and fill in values.',
    );
  }
  // Override DATABASE_URL for all child processes spawned during tests
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
