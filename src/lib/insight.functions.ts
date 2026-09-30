import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  lang: z.enum(["fr", "en"]),
  currency: z.string().min(3).max(3),
  monthlyIncome: z.number(),
  targets: z.object({ needs: z.number(), wants: z.number(), savings: z.number() }),
  actuals: z.object({ needs: z.number(), wants: z.number(), savings: z.number() }),
  topCategories: z.array(z.object({ label: z.string(), amount: z.number() })).max(8),
});

export const getBudgetInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const language = data.lang === "fr" ? "French" : "English";
    const prompt = `Monthly income: ${data.monthlyIncome.toFixed(2)} ${data.currency}
50/30/20 targets -> needs ${data.targets.needs.toFixed(2)}, wants ${data.targets.wants.toFixed(2)}, savings ${data.targets.savings.toFixed(2)}
Actual this month -> needs ${data.actuals.needs.toFixed(2)}, wants ${data.actuals.wants.toFixed(2)}, savings ${data.actuals.savings.toFixed(2)}
Top spending categories: ${data.topCategories.map((c) => `${c.label} ${c.amount.toFixed(2)}`).join(", ") || "none"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-5",
        max_tokens: 500,
        system: `You are a concise personal finance coach for a 50/30/20 budgeting app. Answer in ${language}. Give 2 to 4 short bullet points (max 22 words each): overspending alerts, savings opportunities and one concrete next action. Use the currency ${data.currency}. No preamble, no markdown headings.`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("AI gateway error", response.status, body);
      throw new Error("AI insight unavailable");
    }

    const payload = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text =
      payload.content
        ?.filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("\n")
        .trim() ?? "";

    return { text };
  });
