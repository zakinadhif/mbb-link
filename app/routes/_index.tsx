import type { Route } from "./+types/_index";
import { AuthService } from "~/services/auth.server";
import { Form, Link, useFetcher } from "react-router";
import { Button } from "~/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "mbb.link" },
    { name: "description", content: "Helping you write constructive feedback to your friends." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);

  return { user };
}

export default function IndexRoute({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-[#ee0979] to-[#ff6a00]">
            mbb.link
          </h1>
          <p className="text-xl font-medium text-gray-600">
            Send sincere feedback to your friends! 💌
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {user ? (
            <>
              <Button asChild size="lg" className="w-full text-lg font-bold h-14 shadow-lg hover:scale-105 transition-transform">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full text-lg font-bold h-14 hover:scale-105 transition-transform">
                <Link to="/send">Send Feedback</Link>
              </Button>
            </>
          ) : (
            <Form method="post" action="/login" className="w-full">
              <Button size="lg" type="submit" className="w-full text-lg font-bold h-14 shadow-lg hover:scale-105 transition-transform bg-black text-white hover:bg-gray-900">
                Login with Google
              </Button>
            </Form>
          )}
        </div>
        
        <p className="text-sm text-gray-400 font-medium">
          100% Safe & Secure
        </p>
      </div>
    </div>
  );
}