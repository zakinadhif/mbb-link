import { createContext, RouterContextProvider } from "react-router";

export type ContextProvider = Readonly<RouterContextProvider>;

export type AuthContext = {
  userId: string | null;
}

export type CloudflareContext = {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}

export const cloudflareContext = createContext<CloudflareContext>();
export const authContext = createContext<AuthContext>();