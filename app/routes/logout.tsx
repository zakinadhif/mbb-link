import type { Route } from "../+types/root";
import { initSessionStorage } from "~/session.server";
import { redirect } from "react-router";

export async function action({ request, context }: Route.LoaderArgs) {
  const { getSession, destroySession } = initSessionStorage(context);
  const session = await getSession(request.headers.get("Cookie"));

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}