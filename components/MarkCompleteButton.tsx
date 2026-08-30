"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markLessonCompleteWithoutQuestion } from "@/lib/actions/lesson";

export default function MarkCompleteButton({
  lessonId,
  alreadyCompleted,
  nextHref,
}: {
  lessonId: string;
  alreadyCompleted: boolean;
  nextHref: string | null;
}) {
  const [done, setDone] = useState(alreadyCompleted);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="rounded-lg bg-[var(--ok-bg)] px-3 py-2 text-sm font-semibold text-[var(--ok)]">
          تمّ إكمال الدرس ✓
        </div>
        {nextHref && (
          <Link href={nextHref} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
            الدرس التالي ←
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="mb-3 text-sm text-muted">لا يتوفّر سؤال تحقّق سريع مرتبط بهذا الدرس بعد.</p>
      <button
        onClick={() =>
          startTransition(async () => {
            await markLessonCompleteWithoutQuestion(lessonId);
            setDone(true);
          })
        }
        disabled={pending}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "جارٍ التسجيل..." : "أكملت هذا الدرس"}
      </button>
    </div>
  );
}
