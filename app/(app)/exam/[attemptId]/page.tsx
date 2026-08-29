import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AttemptRunner from "@/components/AttemptRunner";

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { question: true },
      },
    },
  });
  if (!attempt || attempt.userId !== user.id) notFound();
  if (attempt.status === "SUBMITTED") redirect(`/exam/${attemptId}/results`);

  const questions = attempt.questions.map((aq) => ({
    questionId: aq.questionId,
    order: aq.order,
    text: aq.question.questionText,
    options: JSON.parse(aq.question.optionsJson) as string[],
    domainId: aq.question.domainId,
    level: aq.question.level,
    selectedIndex: aq.selectedIndex,
    markedForReview: aq.markedForReview,
  }));

  return (
    <AttemptRunner
      attemptId={attempt.id}
      mode={attempt.mode as "DOMAIN_QUIZ" | "EXAM_MODE" | "MOCK_EXAM"}
      durationSec={attempt.durationSec}
      questions={questions}
    />
  );
}
