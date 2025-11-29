import type { Route } from "./+types/feedback.$token";
import { Form, useActionData, useLoaderData, Link } from "react-router";
import { FeedbackService } from "~/services/feedback.server";
import { AuthService } from "~/services/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StickerEditor } from "~/components/sticker-editor";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const feedbackService = new FeedbackService(context);
  const feedback = await feedbackService.getFeedbackByToken(params.token as string);

  if (!feedback) {
    throw new Response("Not Found", { status: 404 });
  }

  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);

  let canView = false;
  
  // Allow sender to view
  if (user && feedback.senderUserId === user.id) {
    canView = true;
  }

  // Allow recipient to view if they match the criteria
  if (user) {
      if (feedback.recipientUserId === user.id) {
          canView = true;
      }
      
      if (feedback.authenticationMethod === "email") {
          const targetEmail = feedback.recipientEmail || feedback.recipient?.email;
          if (targetEmail && user.email === targetEmail) {
              canView = true;
              if (!feedback.recipientUserId) {
                  await feedbackService.linkRecipient(feedback.id, user.id);
              }
          }
      }
  }

  return { 
    feedback: {
      id: feedback.id,
      authenticationMethod: feedback.authenticationMethod,
      personalQuestion: feedback.personalQuestion,
      decorationPreset: feedback.decorationPreset,
      messageText: canView ? feedback.messageText : null,
      stickers: canView ? feedback.stickers : null,
      recipientEmail: feedback.recipientEmail || feedback.recipient?.email,
    },
    user,
    canView
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const feedbackService = new FeedbackService(context);
  const feedback = await feedbackService.getFeedbackByToken(params.token as string);
  if (!feedback) throw new Response("Not Found", { status: 404 });

  const formData = await request.formData();
  const answer = formData.get("answer") as string;

  let isValid = false;

  if (feedback.authenticationMethod === "question") {
    isValid = await feedbackService.validateAnswer(feedback, answer);
  }

  if (isValid) {
    return { success: true, messageText: feedback.messageText, stickers: feedback.stickers };
  } else {
    return { error: "Incorrect answer." };
  }
}

export default function FeedbackView({ params }: Route.ComponentProps) {
  const { feedback, user, canView: initialCanView } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const showContent = initialCanView || actionData?.success;
  const messageText = initialCanView ? feedback.messageText : actionData?.messageText;
  const stickers = initialCanView ? feedback.stickers : actionData?.stickers;

  if (showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-black mb-6 text-white text-center drop-shadow-md">Feedback for You 💌</h1>
          <StickerEditor 
            initialContent={messageText || ""} 
            initialStickers={stickers as any[] || []} 
            readOnly={true} 
          />
          <div className="mt-8 text-center">
            <p className="text-sm text-white/80 font-medium drop-shadow-sm">
              Sent via <a href="/" className="font-bold hover:underline text-white">mbb.link</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Locked Feedback</h1>
          <p className="text-gray-500 font-medium">
            Verify your identity to unlock this message.
          </p>
        </div>
      
      {feedback.authenticationMethod === "email" && (
        <div className="space-y-6 text-center">
            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                This feedback is for <strong>{feedback.recipientEmail}</strong>.
            </div>
            
            {user ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                    You are logged in as <strong>{user.email}</strong>.
                    <br />
                    This does not match the recipient email.
                    <div className="mt-4">
                        <Form action="/logout" method="post">
                            <Button variant="outline" size="sm" className="rounded-full">Logout</Button>
                        </Form>
                    </div>
                </div>
            ) : (
              <Form method="post" action={`/login?returnTo=/feedback/${params.token}`}>
                <Button className="w-full rounded-full font-bold text-lg h-12 shadow-lg hover:scale-105 transition-transform" type="submit">
                    Login with Google
                </Button>
              </Form>
            )}
        </div>
      )}

      {feedback.authenticationMethod === "question" && (
        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="answer" className="text-lg font-bold block text-center">{feedback.personalQuestion}</Label>
            <Input id="answer" name="answer" placeholder="Type your answer..." required className="h-12 rounded-xl text-center text-lg" />
          </div>

          {actionData?.error && (
            <p className="text-red-500 font-bold text-sm text-center bg-red-50 p-2 rounded-lg">{actionData.error}</p>
          )}

          <Button type="submit" className="w-full rounded-full font-bold text-lg h-12 shadow-lg hover:scale-105 transition-transform">Unlock Feedback</Button>
        </Form>
      )}
    </div>
    </div>
  );
}
