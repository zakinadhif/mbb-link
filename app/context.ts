import { createContext, RouterContextProvider } from "react-router";
import type { UserWithProfile } from "./services/user.server";

export type ContextProvider = Readonly<RouterContextProvider>;

export type AuthContext = {
  user: UserWithProfile | null;
}

export type CloudflareContext = {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}

export const cloudflareContext = createContext<CloudflareContext>();
export const authContext = createContext<AuthContext>();