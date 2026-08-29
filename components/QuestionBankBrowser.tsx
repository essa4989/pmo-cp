"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui";
import { practiceSingleQuestion, toggleBookmark } from "@/lib/actions/questions";

type Question = {
  id: number;
  domainId: number;
  taskNumber: number;
  level: string;
  text: string;
  options: string[];
  answerIndex: number;
  rationale: string;
  answered: boolean;
  correct?: boolean;
  bookmarked: boolean;
};

const LEVELS = ["تذكّر", "تطبيق", "تحليل"];
const STATUS_FILTERS = [
  { key: "all", label: "الكل" },
  { key: "unanswered", label: "لم تُحَل" },
  { key: "incorrect", label: "أخطأت فيها" },
  { key: "bookmarked", label: "محفوظة" },
];

export default function QuestionBankBrowser({
  domains,
  questions,
}: {
  domains: { id: number; titleAr: string }[];
  questions: Question[];
}) {
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (domainFilter !== "all" && q.domainId !== Number(domainFilter)) return false;
      if (levelFilter !== "all" && q.level !== levelFilter) return false;
      if (statusFilter === "unanswered" && q.answered) return false;
      if (statusFilter === "incorrect" && !(q.answered && q.correct === false)) return false;
      if (statusFilter === "bookmarked" && !q.bookmarked) return false;
      if (search.trim() && !q.text.includes(search.trim())) return false;
      return true;
    });
  }, [questions, domainFilter, levelFilter, statusFilter, search]);

  return (
    <div>
      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في نص السؤال..."
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="rounded-lg border border-line px-3 py-2 text-sm">
          <option value="all">كل المجالات</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.titleAr}
            </option>
          ))}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="rounded-lg border border-line px-3 py-2 text-sm">
          <option value="all">كل المستويات</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === f.key ? "bg-brand-700 text-white" : "bg-surface-2 text-muted hover:bg-line"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ltr-num ms-auto self-center text-xs text-muted">{filtered.length} of {questions.length}</span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.map((q) => (
          <QuestionRow
            key={q.id}
            q={q}
            expanded={expanded === q.id}
            onToggleExpand={() => setExpanded(expanded === q.id ? null : q.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
            لا توجد أسئلة مطابقة لهذه الفلاتر.
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionRow({
  q,
  expanded,
  onToggleExpand,
}: {
  q: Question;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctIndex: number; rationale: string } | null>(
    null
  );
  const [bookmarked, setBookmarked] = useState(q.bookmarked);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (selected === null) return;
    startTransition(async () => {
      const res = await practiceSingleQuestion(q.id, selected);
      setResult(res);
    });
  }

  function bookmark() {
    setBookmarked((b) => !b);
    startTransition(() => toggleBookmark(q.id));
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <button onClick={onToggleExpand} className="flex w-full items-center gap-3 px-4 py-3 text-start">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            background: !q.answered ? "var(--line)" : q.correct ? "var(--ok)" : "var(--bad)",
          }}
        />
        <span className="flex-1 text-sm text-ink">{q.text}</span>
        <span className="ltr-num shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
          D{q.domainId}
        </span>
        <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">{q.level}</span>
        {bookmarked && <span className="shrink-0 text-gold-500">★</span>}
      </button>

      {expanded && (
        <div className="border-t border-line px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge tone="muted">مهمة {q.taskNumber}</Badge>
            <button
              onClick={bookmark}
              className={`text-sm font-semibold ${bookmarked ? "text-gold-500" : "text-muted hover:text-gold-500"}`}
            >
              {bookmarked ? "★ محفوظ" : "☆ حفظ السؤال"}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const showResult = !!result;
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

          {!result ? (
            <button
              onClick={submit}
              disabled={selected === null || pending}
              className="mt-3 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              إرسال الإجابة
            </button>
          ) : (
            <div className="mt-3">
              <div
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  result.correct ? "bg-[var(--ok-bg)] text-[var(--ok)]" : "bg-[var(--bad-bg)] text-[var(--bad)]"
                }`}
              >
                {result.correct ? "إجابة صحيحة ✓" : "إجابة غير دقيقة"}
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">{result.rationale}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
