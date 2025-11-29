import { eq, and, desc, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "~/db";
import { feedbackMessages, type FeedbackMessageRecord } from "~/db/schema";
import { cloudflareContext, type ContextProvider } from "~/context";

export class FeedbackService {
  private db: ReturnType<typeof getDb>;

  constructor(context: ContextProvider) {
    const ctx = context.get(cloudflareContext);
    
    this.db = getDb(ctx);
  }

  async createFeedback(data: {
    senderUserId: string;
    recipientUserId: string | null;
    recipientEmail?: string;
    authenticationMethod: "email" | "question";
    personalQuestion?: string;
    personalAnswer?: string;
    messageText: string;
    decorationPreset: string;
    stickers?: any;
  }) {
    let personalAnswerHash = null;
    if (data.authenticationMethod === "question" && data.personalAnswer) {
      const msgBuffer = new TextEncoder().encode(data.personalAnswer.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      personalAnswerHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const [feedback] = await this.db.insert(feedbackMessages).values({
      id: nanoid(),
      senderUserId: data.senderUserId,
      recipientUserId: data.recipientUserId,
      recipientEmail: data.recipientEmail,
      authenticationMethod: data.authenticationMethod,
      personalQuestion: data.personalQuestion,
      personalAnswerHash,
      messageText: data.messageText,
      decorationPreset: data.decorationPreset,
      stickers: data.stickers,
      linkToken: nanoid(10),
    }).returning();

    return feedback;
  }

  async getFeedbackByToken(token: string) {
    const feedback = await this.db.query.feedbackMessages.findFirst({
      where: eq(feedbackMessages.linkToken, token),
      with: {
        sender: true,
        recipient: true,
      }
    });
    
    if (!feedback || feedback.deletedAt) return null;
    return feedback;
  }

  async validateAnswer(feedback: FeedbackMessageRecord, answer: string) {
    if (feedback.authenticationMethod !== "question") return false;
    if (!feedback.personalAnswerHash) return true;

    const msgBuffer = new TextEncoder().encode(answer.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hash === feedback.personalAnswerHash;
  }

  async getSentFeedback(userId: string) {
    return this.db.query.feedbackMessages.findMany({
      where: and(
        eq(feedbackMessages.senderUserId, userId),
        isNull(feedbackMessages.deletedAt)
      ),
      orderBy: desc(feedbackMessages.createdAt),
      with: {
        recipient: true
      }
    });
  }

  async getReceivedFeedback(userId: string) {
    return this.db.query.feedbackMessages.findMany({
      where: and(
        eq(feedbackMessages.recipientUserId, userId),
        isNull(feedbackMessages.deletedAt)
      ),
      orderBy: desc(feedbackMessages.createdAt),
      with: {
        sender: true
      }
    });
  }

  async deleteFeedback(id: string, userId: string) {
    return this.db.update(feedbackMessages)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(feedbackMessages.id, id),
        eq(feedbackMessages.senderUserId, userId)
      ));
  }

  async linkRecipient(feedbackId: string, userId: string) {
    await this.db.update(feedbackMessages)
      .set({ recipientUserId: userId })
      .where(eq(feedbackMessages.id, feedbackId));
  }
}
