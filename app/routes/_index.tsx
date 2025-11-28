import type { Route } from "./+types/_index";
import { authContext } from "~/context";
import { AuthService } from "~/services/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "mbb.link" },
    { name: "description", content: "Helping you write constructive feedback to your friends." },
  ];
}

async function authMiddleware({ request, context }: Route.LoaderArgs) {
  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);

  context.set(authContext, { user });
}

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(authContext).user;

  return { user };
}

export default function IndexRoute() {
  return (
    <p>Hello World!</p>
  );
}