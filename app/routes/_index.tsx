import type { Route } from "./+types/_index";
import { authContext } from "~/context";
import { AuthService } from "~/services/auth.server";
import { Link, useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { initAuthenticator } from "~/authenticator.server";

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

export async function action({ request, context }: Route.ActionArgs) {
  const authenticator = initAuthenticator(context);

  await authenticator.authenticate("google", request);
}

export default function IndexRoute({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const fetcher = useFetcher();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">mbb.link</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        Helping you write constructive feedback to your friends, securely and kindly.
      </p>
      
      <div className="space-x-4">
        {user ? (
          <>
            <Button asChild size="lg">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/send">Send Feedback</Link>
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={() => { fetcher.submit({ provider: "google" }, { method: "post"}); }}>
            Login with Google
          </Button>
        )}
      </div>
    </div>
  );
}