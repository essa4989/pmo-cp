"use client";

import { useState } from "react";

type Q = {
  id: number;
  questionText: string;
  options: string[];
  answerIndex: number;
  rationale: string;
};

// Ungraded bonus self-check pulled from the same verified question bank
// used elsewhere — doesn't touch UserQuestionAttempt, just extra real
// practice beyond the one required quick-check question per lesson.
export default function ExtraPractice({ questions }: { questions: Q[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [pickedByQ, setPickedByQ] = useState<Record<number, number>>({});

  if (questions.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="mb-2 text-xs font-semibold text-brand-700">تدريب إضافي اختياري</div>
      <div className="flex flex-col gap-2">
        {questions.map((q) => {
          const open = openId === q.id;
          const picked = pickedByQ[q.id];
          return (
            <div key={q.id} className="rounded-lg border border-line p-2">
              <button
                onClick={() => setOpenId(open ? null : q.id)}
                className="w-full text-start text-sm font-medium text-ink"
              >
                {q.questionText}
              </button>
              {open && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {q.options.map((opt, i) => {
                    const isPicked = picked === i;
                    const showResult = picked !== undefined;
                    const isCorrect = showResult && i === q.answerIndex;
                    const isWrongPick = showResult && isPicked && i !== q.answerIndex;
                    return (
                      <button
                        key={i}
                        disabled={showResult}
                        onClick={() => setPickedByQ((s) => ({ ...s, [q.id]: i }))}
                        className={`rounded-md border px-2 py-1.5 text-start text-xs transition ${
                          isCorrect
                            ? "border-[var(--ok)] bg-[var(--ok-bg)]"
                            : isWrongPick
                            ? "border-[var(--bad)] bg-[var(--bad-bg)]"
                            : "border-line hover:border-brand-400"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                  {picked !== undefined && (
                    <p className="mt-1 text-[11px] leading-6 text-muted">{q.rationale}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
