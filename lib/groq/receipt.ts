import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

// qwen/qwen3.6-27b is currently the only vision-capable model on Groq
// (meta-llama/llama-4-scout-17b-16e-instruct, the previous vision model,
// was deprecated 2026-06-17). Override via env if Groq's lineup changes
// again before you deploy.
const VISION_MODEL = process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.6-27b";

export const receiptSchema = z.object({
  merchant: z.string().nullable().describe("Name of the store/restaurant, if legible"),
  currency: z
    .string()
    .describe("ISO 4217 currency code inferred from the receipt (symbol, language, or context), e.g. VND, USD"),
  category: z
    .enum(["food", "transport", "lodging", "activities", "shopping", "other"])
    .describe("Best-guess category for this expense"),
  items: z.array(
    z.object({
      name: z.string(),
      unitPrice: z.number().describe("Price per unit, in the receipt's currency"),
      quantity: z.number().default(1),
    })
  ),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  tip: z.number().nullable(),
  discount: z.number().nullable(),
  total: z.number().nullable(),
});

export type ParsedReceipt = z.infer<typeof receiptSchema>;

export async function parseReceiptImage(imageBase64: string, mediaType: string): Promise<ParsedReceipt> {
  const { object } = await generateObject({
    model: groq(VISION_MODEL),
    schema: receiptSchema,
    // qwen3.6-27b (the only vision-capable model Groq currently offers) rejects
    // the strict `json_schema` response format with a 400 — it only supports
    // plain JSON mode. Falling back here means the schema itself isn't sent to
    // the model, so the prompt below spells out the exact field names instead.
    providerOptions: { groq: { structuredOutputs: false } },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Extract every line item, the subtotal, tax, tip, discount, and total from this receipt photo, " +
              "and return ONLY a JSON object (no markdown, no commentary) with exactly this shape:\n" +
              '{ "merchant": string | null, "currency": string, ' +
              '"category": "food" | "transport" | "lodging" | "activities" | "shopping" | "other", ' +
              '"items": [{ "name": string, "unitPrice": number, "quantity": number }], ' +
              '"subtotal": number | null, "tax": number | null, "tip": number | null, ' +
              '"discount": number | null, "total": number | null }\n' +
              "currency is the ISO 4217 code inferred from symbols/context (e.g. VND, USD, INR). " +
              "If a field isn't present on the receipt, use null for it rather than guessing. " +
              "Numbers must be plain numbers (no currency symbols or thousands separators).",
          },
          { type: "image", image: imageBase64, mediaType },
        ],
      },
    ],
  });

  return object;
}
