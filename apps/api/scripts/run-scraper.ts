/**
 * One-shot scraper runner.
 *
 * Usage:
 *   npx tsx scripts/run-scraper.ts
 *
 * Runs the community scraper and prints a summary to stdout.
 * Requires DATABASE_URL to be set in the environment (or .env file).
 */

import 'dotenv/config';
import { runScraper, getScraperStats } from '../src/services/scraper';

(async () => {
  console.log('=== Sphere Community Scraper ===\n');

  const before = await getScraperStats();
  console.log(`Before: ${before.total} total scraped communities`);
  console.log('  By platform:', before.byPlatform);
  console.log('  By status:', before.byStatus, '\n');

  console.log('Starting scrape…');
  const results = await runScraper();

  console.log('\n=== Scrape Results ===');
  let totalFetched = 0;
  let totalInserted = 0;
  for (const r of results) {
    const status = r.error ? `ERROR: ${r.error}` : `fetched=${r.fetched} inserted=${r.inserted}`;
    console.log(`  ${r.platform}: ${status}`);
    totalFetched += r.fetched;
    totalInserted += r.inserted;
  }
  console.log(`\nTotal: fetched=${totalFetched}, inserted=${totalInserted}`);

  const after = await getScraperStats();
  console.log(`\nAfter: ${after.total} total scraped communities`);
  console.log('  By platform:', after.byPlatform);
  console.log('  By status:', after.byStatus);

  process.exit(0);
})();
