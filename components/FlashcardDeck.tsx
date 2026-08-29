"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, Badge } from "@/components/ui";
import { reviewFlashcard } from "@/lib/actions/flashcards";

type CardData = {
  id: string;
  front: string;
  back: string;
  domainId: number;
  lessonCode: string | null;
  lessonTitle: string | null;
  due: boolean;
  reps: number;
};

export default function FlashcardDeck({
  cards,
  domains,
}: {
  cards: CardData[];
  domains: { id: number; titleAr: string }[];
}) {
  const [domainFilter, setDomainFilter] = useState("all");
  const [onlyDue, setOnlyDue] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [pointer] = useState(0);
  const [pending, startTransition] = useTransition();
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const queue = useMemo(() => {
    return cards.filter((c) => {
      if (domainFilter !== "all" && c.domainId !== Number(domainFilter)) return false;
      if (onlyDue && !c.due) return false;
      if (reviewedIds.has(c.id)) return false;
      return true;
    });
  }, [cards, domainFilter, onlyDue, reviewedIds]);

  const current = queue[Math.min(pointer, queue.length - 1)];
  const dueCount = cards.filter((c) => c.due).length;

  function grade(result: "AGAIN" | "HARD" | "GOOD" | "EASY") {
    if (!current) return;
    setReviewedIds((s) => new Set(s).add(current.id));
    setFlipped(false);
    startTransition(() => reviewFlashcard(current.id, result));
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="rounded-lg border border-line px-3 py-2 text-sm">
          <option value="all">كل المجالات</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.titleAr}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} />
          المستحقّة اليوم فقط
        </label>
        <Badge tone="warn">
          <span className="ltr-num">{dueCount}</span> مستحقّة الآن
        </Badge>
        <span className="ltr-num ms-auto text-xs text-muted">{queue.length} in queue</span>
      </div>

      {!current ? (
        <Card className="mt-6 text-center text-sm text-muted">
          لا توجد بطاقات مطابقة للفلاتر الحالية. أحسنت! جرّب إلغاء تفعيل &quot;المستحقّة اليوم فقط&quot; لمراجعة
          إضافية.
        </Card>
      ) : (
        <div className="mt-6">
          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 text-center shadow-sm transition hover:border-brand-500"
          >
            {!flipped ? (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">Front</span>
                <p className="font-display mt-3 text-lg font-bold text-ink">{current.front}</p>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">Back</span>
                <p className="mt-3 text-sm leading-8 text-ink">{current.back}</p>
                {current.lessonTitle && (
                  <p className="mt-3 text-xs text-brand-600">مرتبطة بدرس: {current.lessonTitle}</p>
                )}
              </>
            )}
            <span className="mt-4 text-xs text-muted">اضغط للتقليب</span>
          </button>

          {flipped && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              <GradeBtn label="مرّة أخرى" en="Again" tone="bad" onClick={() => grade("AGAIN")} disabled={pending} />
              <GradeBtn label="صعبة" en="Hard" tone="warn" onClick={() => grade("HARD")} disabled={pending} />
              <GradeBtn label="جيّدة" en="Good" tone="brand" onClick={() => grade("GOOD")} disabled={pending} />
              <GradeBtn label="سهلة" en="Easy" tone="ok" onClick={() => grade("EASY")} disabled={pending} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GradeBtn({
  label,
  en,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  en: string;
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
      className={`rounded-lg px-2 py-2.5 text-xs font-semibold text-white disabled:opacity-50 ${toneClasses[tone]}`}
    >
      <div>{label}</div>
      <div className="ltr-num opacity-80">{en}</div>
    </button>
  );
}
