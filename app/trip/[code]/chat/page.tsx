import { requireTripPageAccess } from "@/lib/auth-page";
import { ChatWindow } from "@/components/trip/ChatWindow";

export default async function ChatPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);

  return <ChatWindow code={code} destination={access.trip.destination} />;
}
