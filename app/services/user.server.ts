import { eq } from 'drizzle-orm';
import { getDb } from '~/db';
import { users } from '~/db/schema';
import { cloudflareContext, type ContextProvider } from '~/context';

export class UserService {
  private db;

  constructor(context: ContextProvider) {
    const ctx = context.get(cloudflareContext);
    this.db = getDb(ctx);
  }

  /**
   * Get user profile
   */
  async getUser(userId: string) {
    const [user] = await this.db.select().from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user || null;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string) {
    const [user] = await this.db.select().from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user || null;
  }

  async findOrCreateUserByEmail(email: string): Promise<typeof users.$inferSelect> {
    const [existingUser] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser) return existingUser;

    // Create new user
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 7);
    const id = crypto.randomUUID();

    const [newUser] = await this.db.insert(users).values({
      id,
      email,
      name: email.split('@')[0],
      username,
    }).returning();

    return newUser;
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(userId: string, data: {
    name?: string;
    bio?: string;
  }) {
    const updateData: Partial<typeof users.$inferInsert> = {};
    
    if (data.name) updateData.name = data.name;
    if (data.bio) updateData.bio = data.bio;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return;
    }

    await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

}
