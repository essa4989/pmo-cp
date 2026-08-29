import { SOURCE_TYPES } from "@/lib/enums";

type Question = {
  id?: number;
  questionText: string;
  optionsJson: string;
  answerIndex: number;
  rationale: string;
  level: string;
  domainId: number;
  taskNumber: number;
  sourceTag: string;
};

const LEVELS = ["تذكّر", "تطبيق", "تحليل"];

export default function QuestionForm({
  question,
  domains,
  action,
  submitLabel,
}: {
  question?: Question;
  domains: { id: number; titleAr: string }[];
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const options: string[] = question ? JSON.parse(question.optionsJson) : ["", "", "", ""];

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs text-muted">
        نص السؤال
        <textarea
          name="questionText"
          defaultValue={question?.questionText}
          rows={3}
          required
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-2">
        {options.map((opt, i) => (
          <label key={i} className="flex items-center gap-2 text-sm">
            <span className="ltr-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs">
              {String.fromCharCode(65 + i)}
            </span>
            <input
              name={`option${i}`}
              defaultValue={opt}
              required
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          الإجابة الصحيحة
          <select name="answerIndex" defaultValue={question?.answerIndex ?? 0} className="rounded-lg border border-line px-3 py-2 text-sm">
            {[0, 1, 2, 3].map((i) => (
              <option key={i} value={i}>
                {String.fromCharCode(65 + i)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          المجال
          <select name="domainId" defaultValue={question?.domainId ?? domains[0]?.id} className="rounded-lg border border-line px-3 py-2 text-sm">
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.titleAr}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          رقم المهمة
          <input
            name="taskNumber"
            type="number"
            min={1}
            defaultValue={question?.taskNumber ?? 1}
            className="ltr-num rounded-lg border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          المستوى
          <select name="level" defaultValue={question?.level ?? LEVELS[0]} className="rounded-lg border border-line px-3 py-2 text-sm">
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs text-muted">
        التفسير (Rationale)
        <textarea
          name="rationale"
          defaultValue={question?.rationale}
          rows={3}
          required
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        نوع المصدر
        <select name="sourceTag" defaultValue={question?.sourceTag ?? "TRAINING"} className="w-56 rounded-lg border border-line px-3 py-2 text-sm">
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="self-start rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">
        {submitLabel}
      </button>
    </form>
  );
}
