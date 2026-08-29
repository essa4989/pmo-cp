import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import QuestionBankBrowser from "@/components/QuestionBankBrowser";

export const metadata = { title: "بنك الأسئلة" };

export default async function QuestionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [domains, questions, attempts, bookmarks] = await Promise.all([
    prisma.domain.findMany({ where: { id: { gt: 0 } }, orderBy: { order: "asc" } }),
    prisma.question.findMany({ orderBy: { id: "asc" } }),
    prisma.userQuestionAttempt.findMany({ where: { userId: user.id } }),
    prisma.bookmark.findMany({ where: { userId: user.id } }),
  ]);

  const latestByQuestion = new Map<number, boolean>();
  for (const a of attempts) latestByQuestion.set(a.questionId, a.correct);
  const bookmarkedIds = new Set(bookmarks.map((b) => b.questionId));

  const data = questions.map((q) => ({
    id: q.id,
    domainId: q.domainId,
    taskNumber: q.taskNumber,
    level: q.level,
    text: q.questionText,
    options: JSON.parse(q.optionsJson) as string[],
    answerIndex: q.answerIndex,
    rationale: q.rationale,
    answered: latestByQuestion.has(q.id),
    correct: latestByQuestion.get(q.id),
    bookmarked: bookmarkedIds.has(q.id),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-xl font-bold text-ink">بنك الأسئلة</h1>
      <p className="mt-1 text-sm text-muted">
        {questions.length} سؤالاً موزّعة على المجالات الستة، بمستويات (تذكّر / تطبيق / تحليل) مع تفسير
        كامل لكل خيار.
      </p>
      <QuestionBankBrowser
        domains={domains.map((d) => ({ id: d.id, titleAr: d.titleAr }))}
        questions={data}
      />
    </div>
  );
}
