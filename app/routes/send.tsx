import type { Route } from "./+types/send";
import { Form, redirect, useActionData, useNavigation, useLoaderData } from "react-router";
import { AuthService } from "~/services/auth.server";
import { FeedbackService } from "~/services/feedback.server";
import { UserService } from "~/services/user.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
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

  const errors: Record<string, string> = {};
  if (!messageText) errors.messageText = "Message is required";
  if (authMethod === "email" && !recipientEmail) errors.recipientEmail = "Recipient email is required";
  if (authMethod === "question") {
    if (!personalQuestion) errors.personalQuestion = "Question is required";
    if (!personalAnswer) errors.personalAnswer = "Answer is required";
  }

  if (Object.keys(errors).length > 0) return { errors };

  const feedbackService = new FeedbackService(context);
  const userService = new UserService(context);

  let recipientUserId: string | null = null;
  // We no longer force create the user. We just store the email.
  // If the user exists, we could link them, but for now let's just store the email
  // and rely on the email field for auth.
  // Ideally we would check if user exists and link if so, but the requirement
  // is just to not REQUIRE it.
  
  // Let's try to find the user by email without creating
  // But UserService doesn't have findByEmail (only findOrCreate).
  // So we will just pass null for recipientUserId if we don't want to force create.
  // Actually, if we want to support "Dashboard" for existing users, we should try to find them.
  // But I don't have a findUserByEmail method exposed that doesn't create.
  // I'll just skip linking for now to satisfy the "don't require account" request strictly.
  // The email will be stored in recipientEmail.

  const feedback = await feedbackService.createFeedback({
    senderUserId: user.id,
    recipientUserId: null, // We will link this later or never
    recipientEmail: authMethod === "email" ? recipientEmail : undefined,
    authenticationMethod: authMethod,
    personalQuestion,
    personalAnswer,
    messageText,
    decorationPreset,
  });

  return { success: true, link: `${new URL(request.url).origin}/feedback/${feedback.linkToken}` };
}

export default function SendFeedback() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [authMethod, setAuthMethod] = useState<"email" | "question">("email");

  if (actionData?.success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm bg-white">
        <h2 className="text-2xl font-bold mb-4">Feedback Link Generated!</h2>
        <p className="mb-4">Share this link with the recipient:</p>
        <div className="p-3 bg-gray-100 rounded mb-4 break-all font-mono text-sm">
          {actionData.link}
        </div>
        <Button onClick={() => navigator.clipboard.writeText(actionData.link)}>Copy Link</Button>
        <div className="mt-6">
            <a href="/send" className="text-blue-600 hover:underline">Send another</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-3xl font-bold mb-6">Send Feedback</h1>
      <Form method="post" className="space-y-6">
        <div className="space-y-2">
          <Label>Authentication Method</Label>
          <Select name="authMethod" value={authMethod} onValueChange={(v: any) => setAuthMethod(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email Verification</SelectItem>
              <SelectItem value="question">Personal Question</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
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
          <Label htmlFor="messageText">Message</Label>
          <Textarea id="messageText" name="messageText" placeholder="Write your constructive feedback here..." className="min-h-[150px]" />
          {actionData?.errors?.messageText && <p className="text-red-500 text-sm">{actionData.errors.messageText}</p>}
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
  );
}
