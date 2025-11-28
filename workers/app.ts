import { createRequestHandler, RouterContextProvider } from "react-router";

import { authContext, cloudflareContext } from "~/context";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { cloudflare: { env, ctx } });
    context.set(authContext, { user: null });

    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
