import { initSessionStorage } from "~/session.server";
import type { Route } from "../+types/root";

export async function action({ request, context }: Route.LoaderArgs) {
  try {
    const sessionStorage = initSessionStorage(context);
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );

    // Nothing to do for anonymous visitors
    if (!session || !session.has("userId")) {
      return new Response(null, { status: 204 });
    }

    // Commit session to refresh cookie expiry (commitSession returns Set-Cookie)
    const setCookie = await sessionStorage.commitSession(session);

    return new Response(null, {
      status: 204,
      headers: {
        "Set-Cookie": setCookie,
      },
    });
  } catch (err) {
    console.error("Error refreshing session:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
