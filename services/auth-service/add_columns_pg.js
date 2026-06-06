const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://marketai:123456@localhost:5433/market_ai_db?schema=public'
});

async function main() {
  await client.connect();
  await client.query(`ALTER TABLE "UserSeller" ADD COLUMN IF NOT EXISTS "description" TEXT;`);
  await client.query(`ALTER TABLE "UserSeller" ADD COLUMN IF NOT EXISTS "city" TEXT;`);
  console.log('Columns added using pg');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
