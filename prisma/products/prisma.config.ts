import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.PRODUCTS_DATABASE_URL,
  },
});
