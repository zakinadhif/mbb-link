import { sql, type InferSelectModel } from "drizzle-orm";
import { 
  sqliteTable, 
  text, 
  integer, 
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

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

export const usersRelations = relations(users, ({ many }) => ({
  sentFeedback: many(feedbackMessages, { relationName: "sender" }),
  receivedFeedback: many(feedbackMessages, { relationName: "recipient" }),
}));

// Feedback Messages
export const feedbackMessages = sqliteTable("feedback_messages", {
  id: text("id").primaryKey(),
  senderUserId: text("sender_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientUserId: text("recipient_user_id").references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: text("recipient_email"),
  authenticationMethod: text("authentication_method", { enum: ["email", "question"] }).notNull(),
  personalQuestion: text("personal_question"),
  personalAnswerHash: text("personal_answer_hash"),
  messageText: text("message_text").notNull(),
  decorationPreset: text("decoration_preset").notNull(),
  linkToken: text("link_token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});
export type FeedbackMessageRecord = InferSelectModel<typeof feedbackMessages>;

export const feedbackMessagesRelations = relations(feedbackMessages, ({ one }) => ({
  sender: one(users, {
    fields: [feedbackMessages.senderUserId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [feedbackMessages.recipientUserId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

// Templates
export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  placeholderText: text("placeholder_text").notNull(),
});
export type TemplateRecord = InferSelectModel<typeof templates>;

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