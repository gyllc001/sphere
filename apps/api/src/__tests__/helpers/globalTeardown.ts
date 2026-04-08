/**
 * Jest global teardown — runs once after all test suites.
 *
 * Responsibilities:
 * - Close any persistent DB connections opened during globalSetup.
 */
export default async function globalTeardown() {
  // No-op until a shared DB pool is introduced in globalSetup.
}
