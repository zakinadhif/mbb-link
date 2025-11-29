import type { Route } from "./+types/dashboard";
import { Form, redirect, useLoaderData, Link } from "react-router";
import { AuthService } from "~/services/auth.server";
import { FeedbackService } from "~/services/feedback.server";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";

export async function loader({ request, context }: Route.LoaderArgs) {
  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);
  if (!user) return redirect("/");

  const feedbackService = new FeedbackService(context);
  const sentFeedback = await feedbackService.getSentFeedback(user.id);
  const receivedFeedback = await feedbackService.getReceivedFeedback(user.id);

  return { user, sentFeedback, receivedFeedback };
}

export async function action({ request, context }: Route.ActionArgs) {
  const authService = new AuthService(context);
  const user = await authService.getCurrentUser(request);
  if (!user) return redirect("/");

  const formData = await request.formData();
  const intent = formData.get("intent");
  const feedbackId = formData.get("feedbackId") as string;

  if (intent === "delete" && feedbackId) {
    const feedbackService = new FeedbackService(context);
    await feedbackService.deleteFeedback(feedbackId, user.id);
  }

  return null;
}

export default function Dashboard() {
  const { user, sentFeedback, receivedFeedback } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
            <Button asChild variant="outline"><Link to="/send">Send New Feedback</Link></Button>
            <Form action="/logout" method="post">
                <Button type="submit" variant="ghost">Logout</Button>
            </Form>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Received Feedback</h2>
          {receivedFeedback.length === 0 ? (
            <p className="text-gray-500">No feedback received yet.</p>
          ) : (
            <ul className="space-y-4">
              {receivedFeedback.map((fb) => (
                <li key={fb.id} className="p-4 bg-white border rounded shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="overflow-hidden">
                        <p className="font-medium truncate w-48">{fb.messageText.substring(0, 50)}...</p>
                        <p className="text-xs text-gray-500">{format(new Date(fb.createdAt!), 'MMM d, yyyy')}</p>
                    </div>
                    <Button asChild size="sm" variant="secondary" className="ml-2">
                        <Link to={`/feedback/${fb.linkToken}`}>View</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Sent Feedback</h2>
          {sentFeedback.length === 0 ? (
            <p className="text-gray-500">No feedback sent yet.</p>
          ) : (
            <ul className="space-y-4">
              {sentFeedback.map((fb) => (
                <li key={fb.id} className="p-4 bg-white border rounded shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="overflow-hidden">
                        <p className="font-medium truncate w-48">{fb.messageText.substring(0, 50)}...</p>
                        <p className="text-xs text-gray-500">
                            To: {fb.recipient ? fb.recipient.email : (fb.recipientEmail || (fb.authenticationMethod === 'question' ? 'Question Auth' : 'Unknown'))}
                        </p>
                        <p className="text-xs text-gray-500">{format(new Date(fb.createdAt!), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex gap-2 ml-2">
                        <Button asChild size="sm" variant="secondary">
                            <Link to={`/feedback/${fb.linkToken}`}>Link</Link>
                        </Button>
                        <Form method="post">
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="feedbackId" value={fb.id} />
                            <Button type="submit" size="sm" variant="destructive">Delete</Button>
                        </Form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
