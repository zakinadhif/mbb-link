import { defineConfig } from 'drizzle-kit';
import fs from "fs";
import path from "path";

import dotenv from "dotenv";
dotenv.config({ path: '.drizzle-kit.env' });

const getLocalD1 = () => {
  try {
    const basePath = path.resolve('.wrangler');
    const dbFile = fs
      .readdirSync(basePath, { encoding: 'utf-8', recursive: true })
      .find((f) => f.endsWith('.sqlite'));

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}`);
    }

    const url = path.resolve(basePath, dbFile);
    return url;
  } catch (err) {
    console.log(`Error ${err}`);

    return "";
  }
} 

if (!["local", "staging", "production"].includes(process.env.TARGET!)) {
  throw new Error(`Invalid target: ${process.env.TARGET}`);
}
console.log(`Running drizzle against ${process.env.TARGET} database`);

export default defineConfig(process.env.TARGET !== 'local' ? {
  schema: './app/db/schema.ts',
  out: './app/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.TARGET === "production" ? process.env.CLOUDFLARE_DATABASE_ID_PRODUCTION! : process.env.CLOUDFLARE_DATABASE_ID_STAGING!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} : {
  schema: './app/db/schema.ts',
  out: './app/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: getLocalD1()
  }
});