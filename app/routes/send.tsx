import type { Route } from "./+types/send";
import { Form, redirect, useActionData, useNavigation, useLoaderData } from "react-router";
import { AuthService } from "~/services/auth.server";
import { FeedbackService } from "~/services/feedback.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { StickerEditor } from "~/components/sticker-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useState } from "react";

export async function loader({ request, context }: Route.LoaderArgs) {
  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);
  if (!user) return redirect("/");
  return { user };
}

export async function action({ request, context }: Route.ActionArgs) {
  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);
  if (!user) return redirect("/");

  const formData = await request.formData();
  const recipientEmail = formData.get("recipientEmail") as string;
  const authMethod = formData.get("authMethod") as "email" | "question";
  const personalQuestion = formData.get("personalQuestion") as string;
  const personalAnswer = formData.get("personalAnswer") as string;
  const messageText = formData.get("messageText") as string;
  const decorationPreset = formData.get("decorationPreset") as string || "default";
  const stickersJson = formData.get("stickers") as string;
  const stickers = stickersJson ? JSON.parse(stickersJson) : undefined;

  const errors: Record<string, string> = {};
  if (!messageText) errors.messageText = "Message is required";
  if (authMethod === "email" && !recipientEmail) errors.recipientEmail = "Recipient email is required";
  if (authMethod === "question") {
    if (!personalQuestion) errors.personalQuestion = "Question is required";
    if (!personalAnswer) errors.personalAnswer = "Answer is required";
  }

  if (Object.keys(errors).length > 0) return { errors };

  const feedbackService = new FeedbackService(context);

  const feedback = await feedbackService.createFeedback({
    senderUserId: user.id,
    recipientUserId: null, // Explicitly null to ensure no automatic linking at creation
    recipientEmail: authMethod === "email" ? recipientEmail : undefined,
    authenticationMethod: authMethod,
    personalQuestion,
    personalAnswer,
    messageText,
    decorationPreset,
    stickers,
  });

  return { success: true, link: `${new URL(request.url).origin}/feedback/${feedback.linkToken}` };
}

export default function SendFeedback() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [authMethod, setAuthMethod] = useState<"email" | "question">("email");
  const [messageText, setMessageText] = useState("");
  const [stickers, setStickers] = useState<any[]>([]);

  if (actionData?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Link Ready! 🎉</h2>
          <p className="text-lg text-gray-600">Share this link with your friend:</p>
          <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 break-all font-mono text-sm text-gray-800 select-all">
            {actionData.link}
          </div>
          <Button size="lg" className="w-full rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform" onClick={() => navigator.clipboard.writeText(actionData.link)}>
            Copy Link
          </Button>
          <div className="pt-4">
              <a href="/send" className="text-primary font-bold hover:underline">Send another</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm p-6 md:p-10 rounded-3xl shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Send Feedback</h1>
          <p className="text-gray-500 font-medium">Write something nice (or constructive)! ✍️</p>
        </div>
        
        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-lg font-bold">Authentication Method</Label>
            <Select name="authMethod" value={authMethod} onValueChange={(v: any) => setAuthMethod(v)}>
              <SelectTrigger className="h-12 rounded-xl border-2">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Verification</SelectItem>
                <SelectItem value="question">Personal Question</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 font-medium">
              {authMethod === "email" 
                ? "Recipient must log in with this email to view." 
                : "Recipient must answer a question you set."}
            </p>
        </div>

        {authMethod === "email" && (
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input id="recipientEmail" name="recipientEmail" type="email" placeholder="friend@example.com" />
            {actionData?.errors?.recipientEmail && <p className="text-red-500 text-sm">{actionData.errors.recipientEmail}</p>}
          </div>
        )}

        {authMethod === "question" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personalQuestion">Question</Label>
              <Input id="personalQuestion" name="personalQuestion" placeholder="e.g. What is the name of our high school?" />
              {actionData?.errors?.personalQuestion && <p className="text-red-500 text-sm">{actionData.errors.personalQuestion}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalAnswer">Answer</Label>
              <Input id="personalAnswer" name="personalAnswer" placeholder="The answer they must provide" />
              {actionData?.errors?.personalAnswer && <p className="text-red-500 text-sm">{actionData.errors.personalAnswer}</p>}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-lg font-bold">Your Message</Label>
          <div className="border-2 rounded-xl overflow-hidden">
            <StickerEditor 
              onChange={(html, newStickers) => {
                setMessageText(html);
                setStickers(newStickers);
              }} 
            />
          </div>
          <input type="hidden" name="messageText" value={messageText} />
          <input type="hidden" name="stickers" value={JSON.stringify(stickers)} />
          {actionData?.errors?.messageText && <p className="text-red-500 text-sm font-bold">{actionData.errors.messageText}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="decorationPreset">Decoration</Label>
            <Select name="decorationPreset" defaultValue="default">
                <SelectTrigger>
                    <SelectValue placeholder="Select decoration" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Default (Clean)</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Generating Link..." : "Generate Link"}
        </Button>
      </Form>
      </div>
    </div>
  );
}
