"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitQuickCheck } from "@/lib/actions/lesson";

type Props = {
  lessonId: string;
  questionId: number;
  questionText: string;
  options: string[];
  alreadyCompleted: boolean;
  nextHref: string | null;
};

export default function QuickCheck({
  lessonId,
  questionId,
  questionText,
  options,
  alreadyCompleted,
  nextHref,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctIndex: number; rationale: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();
  const [skipped, setSkipped] = useState(alreadyCompleted);

  function submit() {
    if (selected === null) return;
    startTransition(async () => {
      const res = await submitQuickCheck(lessonId, questionId, selected);
      setResult(res);
    });
  }

  if (skipped && !result) {
    return (
      <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm text-muted">
        أكملت هذا الدرس سابقاً.{" "}
        <button className="font-semibold text-brand-700 hover:underline" onClick={() => setSkipped(false)}>
          إعادة التحقّق السريع
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 text-xs font-semibold text-brand-600">تحقّق سريع · Quick Check</div>
      <p className="mb-3 text-sm font-medium text-ink">{questionText}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const showResult = result !== null;
          const isCorrect = showResult && i === result.correctIndex;
          const isWrongPick = showResult && isSelected && !result.correct;
          return (
            <button
              key={i}
              disabled={showResult}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-start text-sm transition ${
                isCorrect
                  ? "border-[var(--ok)] bg-[var(--ok-bg)]"
                  : isWrongPick
                  ? "border-[var(--bad)] bg-[var(--bad-bg)]"
                  : isSelected
                  ? "border-brand-600 bg-brand-100"
                  : "border-line hover:border-brand-400"
              }`}
            >
              <span className="ltr-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-[11px]">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {!result && (
        <button
          onClick={submit}
          disabled={selected === null || pending}
          className="mt-3 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "جارٍ التحقّق..." : "إرسال الإجابة"}
        </button>
      )}

      {result && (
        <div className="mt-3">
          <div
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              result.correct ? "bg-[var(--ok-bg)] text-[var(--ok)]" : "bg-[var(--bad-bg)] text-[var(--bad)]"
            }`}
          >
            {result.correct ? "إجابة صحيحة ✓" : "إجابة غير دقيقة"}
          </div>
          <p className="mt-2 text-sm leading-7 text-muted">{result.rationale}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded-full bg-[var(--ok-bg)] px-3 py-1 text-xs font-semibold text-[var(--ok)]">
              تمّ إكمال الدرس ✓
            </span>
            {nextHref && (
              <Link href={nextHref} className="text-sm font-semibold text-brand-700 hover:underline">
                الدرس التالي ←
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
