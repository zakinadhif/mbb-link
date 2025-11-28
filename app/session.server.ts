import {
  createCookieSessionStorage,
  RouterContextProvider,
  type SessionStorage,
} from "react-router";
import { cloudflareContext } from "./context";

type SessionData = {
  userId: string;
};

let sessionStorage: SessionStorage<SessionData, null> | null = null;

export function initSessionStorage(context: Readonly<RouterContextProvider>) {
  const { cloudflare } = context.get(cloudflareContext);

  if (sessionStorage) return sessionStorage;

  sessionStorage = createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [cloudflare.env.COOKIE_SECRET],
      secure: cloudflare.env.APP_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });

  return sessionStorage;
}