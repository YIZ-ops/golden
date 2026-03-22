import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const rawDatabaseUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL;

if (!rawDatabaseUrl) {
  throw new Error(
    '缺少数据库连接串，请配置 POSTGRES_URL_NON_POOLING / POSTGRES_URL / POSTGRES_PRISMA_URL。',
  );
}

const parsedDatabaseUrl = new URL(rawDatabaseUrl);
parsedDatabaseUrl.searchParams.delete('sslmode');
const databaseUrl = parsedDatabaseUrl.toString();

const sqlFiles = [
  path.join(projectRoot, 'supabase', 'migrations', '20260321_initial_schema.sql'),
  path.join(projectRoot, 'supabase', 'migrations', '20260322_people_works_quotes.sql'),
  path.join(projectRoot, 'supabase', 'migrations', '20260322_legacy_singer_cleanup.sql'),
  path.join(projectRoot, 'supabase', 'seed.sql'),
  path.join(projectRoot, 'supabase', 'seeds', 'people.sql'),
  path.join(projectRoot, 'supabase', 'seeds', 'works.sql'),
  path.join(projectRoot, 'supabase', 'seeds', 'quotes-curated.sql'),
];

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  await client.connect();

  for (const filePath of sqlFiles) {
    const sql = await readFile(filePath, 'utf8');
    const label = path.relative(projectRoot, filePath);
    console.log(`Running ${label} ...`);
    await client.query(sql);
    console.log(`Finished ${label}`);
  }

  console.log('Remote database bootstrap completed.');
} finally {
  await client.end().catch(() => undefined);
}
