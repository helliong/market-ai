import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';

config({ path: '../../.env', quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
