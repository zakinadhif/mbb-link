import type { Route } from "./+types/feedback.$token";
import { Form, useActionData, useLoaderData } from "react-router";
import { FeedbackService } from "~/services/feedback.server";
import { AuthService } from "~/services/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const feedbackService = new FeedbackService(context);
  const feedback = await feedbackService.getFeedbackByToken(params.token as string);

  if (!feedback) {
    throw new Response("Not Found", { status: 404 });
  }

  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);

  let canView = false;
  if (user && (feedback.recipientUserId === user.id || feedback.senderUserId === user.id)) {
    canView = true;
  }

  return { 
    feedback: {
      id: feedback.id,
      authenticationMethod: feedback.authenticationMethod,
      personalQuestion: feedback.personalQuestion,
      decorationPreset: feedback.decorationPreset,
      messageText: canView ? feedback.messageText : null,
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
  const email = formData.get("email") as string;
  const answer = formData.get("answer") as string;

  let isValid = false;

  if (feedback.authenticationMethod === "email") {
    // Check against stored recipientEmail OR linked user email
    if (feedback.recipientEmail && feedback.recipientEmail === email) {
      isValid = true;
    } else if (feedback.recipient && feedback.recipient.email === email) {
      isValid = true;
    }
  } else if (feedback.authenticationMethod === "question") {
    isValid = await feedbackService.validateAnswer(feedback, answer);
  }

  if (isValid) {
    return { success: true, messageText: feedback.messageText };
  } else {
    return { error: "Incorrect authentication details." };
  }
}

export default function FeedbackView() {
  const { feedback, canView: initialCanView } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const showContent = initialCanView || actionData?.success;
  const messageText = initialCanView ? feedback.messageText : actionData?.messageText;

  if (showContent) {
    // Decoration styles
    const decorationStyles: Record<string, string> = {
        default: "bg-white border-gray-200",
        warm: "bg-orange-50 border-orange-200",
        professional: "bg-slate-50 border-slate-200 font-serif",
    };
    const style = decorationStyles[feedback.decorationPreset] || decorationStyles.default;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className={`max-w-2xl w-full p-8 rounded-xl shadow-lg border ${style}`}>
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Feedback for You</h1>
          <div className="prose prose-lg text-gray-700 whitespace-pre-wrap">
            {messageText}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
            <p className="text-sm text-gray-500">
              Sent via <a href="/" className="font-semibold hover:underline">mbb.link</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-sm border">
      <h1 className="text-2xl font-bold mb-6 text-center">Authenticate to View</h1>
      <p className="mb-6 text-center text-gray-600">
        This feedback is protected. Please verify your identity to view it.
      </p>
      
      <Form method="post" className="space-y-4">
        {feedback.authenticationMethod === "email" && (
          <div className="space-y-2">
            <Label htmlFor="email">Enter your email address</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
        )}

        {feedback.authenticationMethod === "question" && (
          <div className="space-y-2">
            <Label htmlFor="answer">{feedback.personalQuestion}</Label>
            <Input id="answer" name="answer" placeholder="Your answer" required />
          </div>
        )}

        {actionData?.error && (
          <p className="text-red-500 text-sm text-center">{actionData.error}</p>
        )}

        <Button type="submit" className="w-full">View Feedback</Button>
      </Form>
    </div>
  );
}
