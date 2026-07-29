import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { CHAT_MODEL } from "./chat";

export const textExpenseSchema = z.object({
  title: z.string().nullable().describe("Short title for this expense (e.g. the restaurant/place name), if mentioned"),
  currency: z
    .string()
    .describe("ISO 4217 currency code — infer from symbols/context, or fall back to the given default"),
  category: z
    .enum(["food", "transport", "lodging", "activities", "shopping", "other"])
    .describe("Best-guess category for this expense"),
  items: z.array(
    z.object({
      name: z.string(),
      unitPrice: z.number().describe("Price for this line item (the total for this item, not per-person)"),
      quantity: z.number().default(1),
      sharedBy: z
        .array(z.string())
        .describe("Exact names, copied verbatim from the given member list, of who had/shared this item"),
    })
  ),
  tax: z.number().nullable(),
  tip: z.number().nullable(),
  discount: z.number().nullable(),
});

export type ParsedTextExpense = z.infer<typeof textExpenseSchema>;

export async function parseExpenseText(
  text: string,
  memberNames: string[],
  defaultCurrency: string
): Promise<ParsedTextExpense> {
  const { object } = await generateObject({
    model: groq(CHAT_MODEL),
    schema: textExpenseSchema,
    // llama-3.3-70b-versatile isn't on Groq's structured-outputs support list
    // (only openai/gpt-oss-20b/120b are) — it rejects the strict `json_schema`
    // response format with a 400. Plain JSON mode works, but the schema itself
    // isn't sent to the model that way, so the prompt spells out the shape.
    providerOptions: { groq: { structuredOutputs: false } },
    messages: [
      {
        role: "user",
        content:
          `Trip members: ${memberNames.join(", ")}. Default currency if none is mentioned: ${defaultCurrency}.\n\n` +
          "Read this description of a shared expense and split it into line items, matching each item to exactly " +
          "which of the trip members above had or shared it — use their exact names as given, copied verbatim. " +
          'If the text implies everyone shared something (e.g. "we all had..." or "split equally"), list every ' +
          "member's name for that item. If the amount isn't broken into items (e.g. just a total for a taxi or " +
          "grab), return one item covering the whole amount with everyone it applies to. Numbers must be plain " +
          "numbers (no currency symbols or thousands separators).\n\n" +
          "Return ONLY a JSON object (no markdown, no commentary) with exactly this shape:\n" +
          '{ "title": string | null, "currency": string, ' +
          '"category": "food" | "transport" | "lodging" | "activities" | "shopping" | "other", ' +
          '"items": [{ "name": string, "unitPrice": number, "quantity": number, "sharedBy": string[] }], ' +
          '"tax": number | null, "tip": number | null, "discount": number | null }\n\n' +
          "Description:\n" +
          text,
      },
    ],
  });

  return object;
}
