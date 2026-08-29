"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/auth";
import { searchCurriculum, type AssistantMatch } from "@/lib/assistant";

const NOT_FOUND_MSG = "هذه المعلومة غير موجودة في المحتوى المعتمد.";

export type AssistantResponse = {
  answer: string | null; // generated synthesis, or null when only raw matches are shown
  matches: AssistantMatch[];
  mode: "generative" | "retrieval" | "not_found";
};

export async function askAssistant(question: string): Promise<AssistantResponse> {
  await requireUser();

  const q = question.trim();
  if (!q) return { answer: null, matches: [], mode: "not_found" };

  const matches = await searchCurriculum(q, 5);

  if (matches.length === 0) {
    return { answer: NOT_FOUND_MSG, matches: [], mode: "not_found" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No model configured: return the grounded retrieval results as-is —
    // still fully answers the "explain + example + lesson + source" brief,
    // just without a synthesized paragraph on top.
    return { answer: null, matches, mode: "retrieval" };
  }

  try {
    const client = new Anthropic({ apiKey });
    const context = matches
      .map((m, i) => `[${i + 1}] (${m.type} — ${m.sourceTag}) ${m.title}\n${m.snippet}`)
      .join("\n\n");

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 700,
      output_config: { effort: "low" },
      system:
        "أنت مساعد دراسة لمنصّة PMI-PMOCP Self-Study Academy. أجب بالعربية، وباختصار ووضوح شديدين، " +
        "معتمداً حصراً وحرفياً على المقتطفات المرقّمة أدناه من المنهج المعتمد — لا تستخدم أي معرفة خارجية " +
        "عن PMI أو PMBOK أو الشهادة مهما بدت واثقاً منها. اذكر رقم المقتطف الذي استندت إليه بين قوسين مثل (١). " +
        "إن كانت المقتطفات لا تجيب عن السؤال فعلياً، اكتب فقط هذه الجملة دون أي إضافة: \"" +
        NOT_FOUND_MSG +
        '"',
      messages: [
        {
          role: "user",
          content: `المقتطفات المعتمدة:\n\n${context}\n\nسؤال المتعلّم: ${q}`,
        },
      ],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const answer = textBlock?.text?.trim() || NOT_FOUND_MSG;
    return { answer, matches, mode: "generative" };
  } catch {
    // Fall back to plain retrieval if the model call fails for any reason —
    // never break the assistant just because the optional LLM layer is down.
    return { answer: null, matches, mode: "retrieval" };
  }
}
