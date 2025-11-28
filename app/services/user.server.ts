import { eq } from 'drizzle-orm';
import type { AppLoadContext } from 'react-router';
import { getDb } from '~/db';
import { users } from '~/db/schema';
import { cloudflareContext, type ContextProvider } from '~/context';
import { StorageService } from './storage.server';

export type SocialMedia = {
  platform: SocialMediaPlatform;
  handle: string;
  url: string; // computed URL
};

export type UserWithSocialMedia = Omit<typeof users.$inferSelect, 'socialMedia'> & {
  socialMedia: SocialMedia[];
};

export type UserWithProfile = UserWithSocialMedia;

export type SocialMediaPlatform = 
  | 'instagram' 
  | 'x' 
  | 'tiktok' 
  | 'whatsapp'
  | 'linktree'
  | 'web';

export class UserService {
  private db;
  private storageService: StorageService;
  private cdnUrl?: string;

  private _transformUserProfileURL(user: UserWithProfile): UserWithProfile {
    return {
      ...user,
      profilePic: user.profilePic
        ? user.profilePic.startsWith('http')
          ? user.profilePic 
          : `${this.cdnUrl ?? ""}/${user.profilePic}/thumbnail`
        : null,
    }
  }

  constructor(context: ContextProvider) {
    const ctx = context.get(cloudflareContext);
    this.storageService = new StorageService(context);
    this.cdnUrl = ctx.cloudflare.env.CDN_URL;
    this.db = getDb(ctx);
  }

  /**
   * Get user profile with social media accounts
   */
  async getUser(userId: string): Promise<UserWithProfile | null> {
    const user = await this.db.select().from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return this._transformUserProfileURL({
      ...user[0],
      socialMedia: this._parseSocialMedia(user[0].socialMedia),
    });
  }

  /**
   * Get user profile with social media accounts
   */
  async getUserByUsername(username: string): Promise<UserWithProfile | null> {
    const user = await this.db.select().from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return this._transformUserProfileURL({
      ...user[0],
      socialMedia: this._parseSocialMedia(user[0].socialMedia),
    });
  }


  /**
   * Update user profile information
   */
  async updateUserProfile(userId: string, data: {
    profilePic?: File;
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    socialMedia?: Array<{ platform: string; handle: string }>;
  }): Promise<void> {
    const updateData: Partial<typeof users.$inferInsert> = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.socialMedia) updateData.socialMedia = data.socialMedia;
    if (data.bio) updateData.bio = data.bio;
    if (data.profilePic) {
      await this.storageService.deleteFile(`profiles/${userId}`);
      const uploaded = await this.storageService.uploadFile(data.profilePic, `profiles/${userId}`);
      if (uploaded) {
        updateData.profilePic = `profiles/${userId}`;
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return;
    }

    await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

  // ---------------------------------------------------------------------------
  // Private utilities
  // ---------------------------------------------------------------------------

  /**
   * Parse social media accounts from JSON and add computed URLs
   */
  private _parseSocialMedia(socialMediaJson: unknown): SocialMedia[] {
    if (!socialMediaJson || !Array.isArray(socialMediaJson)) {
      return [];
    }

    const accounts = socialMediaJson as Array<{ platform: string; handle: string }>;
    
    return accounts.map(account => ({
      platform: account.platform as SocialMediaPlatform,
      handle: account.handle,
      url: this._generatePlatformUrl(account.platform as SocialMediaPlatform, account.handle)
    }));
  }

  /**
   * Generate platform URL from handle
   */
  private _generatePlatformUrl(platform: SocialMediaPlatform, handle: string): string {
    const cleanHandle = platform !== "web" ? handle.replace('@', '') : handle;

    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${cleanHandle}`;
      case 'x':
        return `https://x.com/${cleanHandle}`;
      case 'tiktok':
        return `https://tiktok.com/@${cleanHandle}`;
      case 'linktree':
        return `https://linktr.ee/${cleanHandle}`;
      case 'web':
        // For web, we expect the handle to be a full URL
        return cleanHandle.startsWith('http') ? cleanHandle : `https://${cleanHandle}`;
      case 'whatsapp':
        // For WhatsApp, we expect the handle to be a phone number
        return `https://wa.me/${cleanHandle}`;
      default:
        return '';
    }
  }
}
