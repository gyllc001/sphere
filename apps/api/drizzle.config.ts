import 'dotenv/config';
import path from 'path';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: path.resolve(__dirname, './src/db/schema/index.ts'),
  out: path.resolve(__dirname, './src/db/migrations'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
