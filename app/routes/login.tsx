import { GalleryVerticalEnd } from "lucide-react"
import { Button } from "~/components/ui/button"
import { initAuthenticator } from "~/authenticator.server";
import type { Route } from "../+types/root";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { useFetcher } from "react-router";

export async function action({ request, context, params }: Route.ActionArgs) {
  const authenticator = initAuthenticator(context);

  await authenticator.authenticate("google", request);
}

export default function LoginPage() {
  const fetcher = useFetcher();

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <form>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <a
                  href="#"
                  className="flex flex-col items-center gap-2 font-medium"
                >
                  <div className="flex size-8 items-center justify-center rounded-md">
                    <GalleryVerticalEnd className="size-6" />
                  </div>
                  <span className="sr-only">Acme Inc.</span>
                </a>
                <h1 className="text-xl font-bold text-center">Selamat Datang ke MBB</h1>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" type="button" className="w-full" onClick={() => { fetcher.submit({ provider: "google" }, { method: "post" }); }}>
                  <SiGoogle />
                  Continue with Google
                </Button>
              </div>
            </div>
          </form>
          <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
            By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
            and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}