import { initAuthenticator, initAuthTransactionContextStorage } from "~/authenticator.server";
import type { Route } from "../+types/root";
import { redirect } from "react-router";
import { initSessionStorage } from "~/session.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const authenticator = initAuthenticator(context);

    let { userId } = await authenticator.authenticate("google", request);
  
    const authTransactionContextStorage = initAuthTransactionContextStorage(context);
    const authTransactionContext = await authTransactionContextStorage.getSession(request.headers.get("Cookie"));

    const sessionStorage = initSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));

    session.set("userId", userId);

    const returnTo = authTransactionContext.get("returnTo") || "/";

    return redirect(returnTo, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session)
      }
    });
  } catch (error) {
    return redirect("/login?error=authentication_failed");
  }
}