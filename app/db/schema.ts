import { sql, type InferSelectModel } from "drizzle-orm";
import { 
  sqliteTable, 
  text, 
  integer, 
  primaryKey,
} from "drizzle-orm/sqlite-core";

// User model
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  profilePic: text("profile_pic"),
  bio: text("bio"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
export type UserRecord = InferSelectModel<typeof users>;

// OAuth accounts for users
export const oauthAccounts = sqliteTable(
  "oauth_accounts",
  {
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ name: "pk", columns: [t.provider, t.providerAccountId] })
  ]
);
export type OAuthAccountRecord = InferSelectModel<typeof oauthAccounts>;