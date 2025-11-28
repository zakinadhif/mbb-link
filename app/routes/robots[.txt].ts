// TODO(zndf): use vite bundler to generate robots.txt instead of using this

import { cloudflareContext } from "~/context";
import type { Route } from "./+types/robots[.txt]";

// Allows crawling on production, but not in staging
const robots = {
  production: [
    "User-agent: *",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /private/",
    "Allow: /",
  ].join("\n"),
  staging: [
    "User-agent: *",
    "Disallow: /",
  ].join("\n"),
}

export async function loader({ context }: Route.LoaderArgs) {
  const ctx = context.get(cloudflareContext);

  if (ctx.cloudflare.env.APP_ENV === "production") {
    return new Response(robots.production, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } else if (ctx.cloudflare.env.APP_ENV === "staging") {
    return new Response(robots.staging, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new Response("Not Found", {
    headers: {
      "Content-Type": "text/plain",
    },
    status: 404,
    statusText: "Not Found",
  });
}