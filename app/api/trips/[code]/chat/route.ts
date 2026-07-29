import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTripAccess } from "@/lib/auth";
import { CHAT_MODEL, buildTripAssistantPrompt } from "@/lib/groq/chat";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return new Response("Unauthorized", { status: 401 });

  const access = await getTripAccess(code, profile);
  if (!access) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: places } = await supabase
    .from("trip_places")
    .select("name, category, status")
    .eq("trip_id", access.trip.id);

  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: groq(CHAT_MODEL),
    system: buildTripAssistantPrompt({
      destination: access.trip.destination,
      tripName: access.trip.name,
      places: places ?? undefined,
    }),
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
