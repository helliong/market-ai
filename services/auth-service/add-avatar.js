const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://marketai:123456@localhost:5433/market_ai_db?schema=public' });
client.connect()
  .then(() => client.query('ALTER TABLE "User" ADD COLUMN avatar TEXT;'))
  .then(() => { console.log('Column added'); client.end(); })
  .catch(e => { console.error(e); client.end(); });
