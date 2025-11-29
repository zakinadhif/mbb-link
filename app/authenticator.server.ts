import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { createCookieSessionStorage, type SessionStorage } from "react-router";
import { Authenticator } from "remix-auth";
import { OAuth2Strategy, CodeChallengeMethod } from "remix-auth-oauth2";
import { getDb } from "~/db";
import { oauthAccounts, users } from "~/db/schema";
import { cloudflareContext, type ContextProvider } from "./context";

type AuthTransactionContext = {
  returnTo: string;
}
let authTransactionContextStorage: SessionStorage<AuthTransactionContext, null> | null = null;

export const initAuthTransactionContextStorage = (context: ContextProvider) => {
  const { cloudflare } = context.get(cloudflareContext);

  if (authTransactionContextStorage) return authTransactionContextStorage;

  authTransactionContextStorage = createCookieSessionStorage({
    cookie: {
      name: "__auth_context",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [cloudflare.env.COOKIE_SECRET],
      secure: cloudflare.env.APP_ENV === "production",
      maxAge: 60 * 3, // 3 minutes
    },
  });

  return authTransactionContextStorage;
}

type AuthResult = {
  userId: string;
}
let authenticator: Authenticator<AuthResult> | null = null;

export function initAuthenticator(context: ContextProvider) {
  const ctx = context.get(cloudflareContext);

  if (authenticator) return authenticator;

  authenticator = new Authenticator<AuthResult>();

  authenticator.use(
    new OAuth2Strategy(
      {
        cookie: "oauth2",

        clientId: ctx.cloudflare.env.GOOGLE_CLIENT_ID,
        clientSecret: ctx.cloudflare.env.GOOGLE_CLIENT_SECRET,

        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        redirectURI: ctx.cloudflare.env.GOOGLE_REDIRECT_URI,

        scopes: ["openid", "email", "profile"],
        codeChallengeMethod: CodeChallengeMethod.S256,
      },
      async ({ tokens }) => {
        const accessToken = tokens.accessToken();

        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const googleProfile = await profileResponse.json() as {
          sub: string;
          name: string;
          given_name: string;
          family_name: string;
          picture: string;
          email: string;
          email_verified: boolean;
        };

        if (!googleProfile.email_verified) {
          throw new Error("Google account email not verified");
        }

        const db = getDb(ctx);

        // Check if the user already exists
        const existingOAuthAccount = await db
          .select()
          .from(oauthAccounts)
          .where(
            and(
              eq(oauthAccounts.provider, "google"),
              eq(oauthAccounts.providerAccountId, googleProfile.sub)
            )
          ).get();

        if (existingOAuthAccount) {
          // Get the user from the database
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, existingOAuthAccount.userId))
            .get();

          if (!user) {
            throw new Error("User not found");
          }

          // Return the user session
          return { userId: user.id };
        }

        // Create a new user
        const userId = nanoid();
        await db.insert(users).values({
          id: userId,
          name: googleProfile.name,
          username: googleProfile.name.replaceAll(" ", "_").toLowerCase() + "_" + Math.floor(Math.random() * 900 + 100),
          email: googleProfile.email,
          profilePic: googleProfile.picture,
        });

        // Create a new OAuth account
        await db.insert(oauthAccounts).values({
          provider: 'google',
          providerAccountId: googleProfile.sub,
          userId,
        });

        // Return the user session
        return { userId };
      }
    ),
    "google"
  );

  return authenticator;
}

