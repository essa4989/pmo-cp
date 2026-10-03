"use client";

import { useMemo, useState, useTransition } from "react";
import { reviewFlashcard } from "@/lib/actions/flashcards";
import type { FlashcardResult } from "@/lib/enums";

type Card = { id: string; front: string; back: string };

export default function LessonFlashcards({ cards }: { cards: Card[] }) {
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const remaining = useMemo(() => cards.filter((c) => !doneIds.has(c.id)), [cards, doneIds]);
  const current = remaining[0];

  if (cards.length === 0) return null;

  function grade(result: FlashcardResult) {
    if (!current) return;
    setDoneIds((s) => new Set(s).add(current.id));
    setFlipped(false);
    startTransition(() => reviewFlashcard(current.id, result));
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-brand-700">
        <span>🗂️ بطاقات هذا الدرس — تكرار متباعد</span>
        <span className="ltr-num text-muted">
          {doneIds.size}/{cards.length}
        </span>
      </div>

      {!current ? (
        <div className="rounded-lg bg-[var(--ok-bg)] p-3 text-center text-xs text-[var(--ok)]">
          راجعت كل بطاقات هذا الدرس — ستُعاد جدولتها تلقائياً في وقتها حسب تقييمك لها.
        </div>
      ) : (
        <>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[120px] w-full flex-col items-center justify-center rounded-lg border border-line bg-surface-2 p-4 text-center transition hover:border-brand-500"
          >
            {!flipped ? (
              <p className="text-sm font-semibold text-ink">{current.front}</p>
            ) : (
              <p className="whitespace-pre-line text-sm leading-7 text-ink">{current.back}</p>
            )}
            <span className="mt-3 text-[11px] text-muted">اضغط للتقليب</span>
          </button>

          {flipped && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              <GradeBtn label="مرّة أخرى" tone="bad" onClick={() => grade("AGAIN")} disabled={pending} />
              <GradeBtn label="صعبة" tone="warn" onClick={() => grade("HARD")} disabled={pending} />
              <GradeBtn label="جيّدة" tone="brand" onClick={() => grade("GOOD")} disabled={pending} />
              <GradeBtn label="سهلة" tone="ok" onClick={() => grade("EASY")} disabled={pending} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GradeBtn({
  label,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  tone: "bad" | "warn" | "brand" | "ok";
  onClick: () => void;
  disabled?: boolean;
}) {
  const toneClasses: Record<string, string> = {
    bad: "bg-[var(--bad)] hover:opacity-90",
    warn: "bg-[var(--warn)] hover:opacity-90",
    brand: "bg-brand-700 hover:bg-brand-800",
    ok: "bg-[var(--ok)] hover:opacity-90",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2 py-2 text-xs font-semibold text-white disabled:opacity-50 ${toneClasses[tone]}`}
    >
      {label}
    </button>
  );
}
