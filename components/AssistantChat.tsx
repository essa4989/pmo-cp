"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card, Badge } from "@/components/ui";
import { askAssistant, type AssistantResponse } from "@/lib/actions/assistant";

type Turn = { question: string; response: AssistantResponse };

const SUGGESTIONS = [
  "ما الفرق بين الحوكمة والاستراتيجية؟",
  "ما الفرق بين العميل وصاحب المصلحة؟",
  "كيف أميّز نضج OPM عن نضج المكتب؟",
  "ما هو عرض القيمة (Value Proposition)؟",
];

export default function AssistantChat() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, startTransition] = useTransition();

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setInput("");
    startTransition(async () => {
      const response = await askAssistant(q);
      setTurns((prev) => [...prev, { question: q, response }]);
    });
  }

  return (
    <div className="mt-5">
      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted hover:border-brand-500 hover:text-brand-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {turns.map((t, i) => (
          <div key={i}>
            <div className="ms-auto max-w-[85%] rounded-2xl rounded-ee-sm bg-brand-700 px-4 py-2.5 text-sm text-white">
              {t.question}
            </div>
            <Card className="mt-2 max-w-[92%]">
              {t.response.mode === "not_found" && (
                <p className="text-sm text-muted">{t.response.answer}</p>
              )}

              {t.response.mode === "generative" && (
                <>
                  <p className="whitespace-pre-line text-sm leading-7 text-ink">{t.response.answer}</p>
                  <MatchList matches={t.response.matches} title="المقتطفات المستخدَمة" />
                </>
              )}

              {t.response.mode === "retrieval" && (
                <>
                  <p className="text-xs text-muted">أقرب محتوى من المنهج المعتمد لسؤالك:</p>
                  <MatchList matches={t.response.matches} title="" />
                </>
              )}
            </Card>
          </div>
        ))}
        {pending && <div className="text-xs text-muted">المساعد يبحث في المنهج المعتمد…</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="sticky bottom-4 mt-5 flex gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lg"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك عن المنهج..."
          className="flex-1 rounded-xl border-none px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-xl bg-brand-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          إرسال
        </button>
      </form>
    </div>
  );
}

function MatchList({ matches, title }: { matches: AssistantResponse["matches"]; title: string }) {
  if (matches.length === 0) return null;
  return (
    <div className="mt-3 border-t border-line pt-3">
      {title && <div className="mb-2 text-[11px] font-semibold text-muted">{title}</div>}
      <div className="flex flex-col gap-2">
        {matches.map((m, i) => (
          <Link key={i} href={m.href} className="block rounded-lg bg-surface-2 px-3 py-2 text-sm hover:bg-brand-100">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-ink">{m.title}</span>
              <Badge tone="muted">{m.sourceTag}</Badge>
            </div>
            <p className="mt-1 text-xs leading-6 text-muted">{m.snippet}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
