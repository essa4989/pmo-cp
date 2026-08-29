import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FlashcardDeck from "@/components/FlashcardDeck";

export const metadata = { title: "البطاقات التعليمية" };

export default async function FlashcardsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [cards, states, domains] = await Promise.all([
    prisma.flashcard.findMany({ include: { lesson: { select: { code: true, titleAr: true } } } }),
    prisma.userFlashcardState.findMany({ where: { userId: user.id } }),
    prisma.domain.findMany({ where: { id: { gt: 0 } }, orderBy: { order: "asc" } }),
  ]);

  const stateByCard = new Map(states.map((s) => [s.flashcardId, s]));
  const now = new Date();

  const data = cards.map((c) => {
    const s = stateByCard.get(c.id);
    return {
      id: c.id,
      front: c.front,
      back: c.back,
      domainId: c.domainId,
      lessonCode: c.lesson?.code ?? null,
      lessonTitle: c.lesson?.titleAr ?? null,
      due: !s || s.dueAt <= now,
      reps: s?.reps ?? 0,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold text-ink">البطاقات التعليمية — Flashcards</h1>
      <p className="mt-1 text-sm text-muted">
        مراجعة بتكرار متباعد (Spaced Repetition): قيّم كل بطاقة بصدق ليعيد النظام جدولتها في الوقت
        الأنسب لك.
      </p>
      <FlashcardDeck cards={data} domains={domains.map((d) => ({ id: d.id, titleAr: d.titleAr }))} />
    </div>
  );
}
