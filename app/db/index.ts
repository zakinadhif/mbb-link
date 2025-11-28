import { drizzle } from 'drizzle-orm/d1';
import type { AppLoadContext } from 'react-router';
import * as schema from './schema';

/**
 * Creates a database connection using the Cloudflare D1 binding
 * @param context The React Router app load context containing Cloudflare bindings
 * @returns A DrizzleORM instance connected to the D1 database
 */
export function getDb(context: AppLoadContext) {
  // Get the D1 database binding from the Cloudflare context
  const db = drizzle(context.cloudflare.env.DB, { schema });
  
  return db;
}

/**
 * Type definition for the database schema
 */
export type Schema = typeof schema;

/**
 * Type for the database instance
 */
export type Database = ReturnType<typeof getDb>;