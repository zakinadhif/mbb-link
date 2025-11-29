import { initAuthenticator, initAuthTransactionContextStorage } from "~/authenticator.server";
import type { Route } from "./+types/login";

export async function action({ request, context }: Route.ActionArgs) {
  const authenticator = initAuthenticator(context);
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");

  try {
    await authenticator.authenticate("google", request);
  } catch (error) {
    if (error instanceof Response && returnTo?.startsWith("/feedback/")) {
      const authTransactionContextStorage = initAuthTransactionContextStorage(context);
      const session = await authTransactionContextStorage.getSession(request.headers.get("Cookie"));
      session.set("returnTo", returnTo);
      error.headers.append("Set-Cookie", await authTransactionContextStorage.commitSession(session));
    }
    throw error;
  }
}
