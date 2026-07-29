export const CHAT_MODEL = process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile";

export function buildTripAssistantPrompt(params: {
  destination: string;
  tripName: string;
  places?: { name: string; category: string; status: string }[];
}) {
  const placesLine = params.places?.length
    ? `\n\nPlaces already on the trip's itinerary:\n${params.places
        .map((p) => `- ${p.name} (${p.category}, ${p.status})`)
        .join("\n")}`
    : "";

  return (
    `You are a knowledgeable, concise local travel assistant helping a group plan and manage their trip ` +
    `"${params.tripName}" to ${params.destination}. ` +
    `Answer questions about the destination (things to do, local customs, transport, safety), give rough ` +
    `price estimates in the local currency when asked "how much does X cost," and suggest itinerary ideas. ` +
    `Keep answers practical and short unless asked for more detail. If you don't know something specific ` +
    `and current (like exact prices or opening hours), say so and give a reasonable estimate/range instead ` +
    `of inventing a precise figure.${placesLine}`
  );
}
