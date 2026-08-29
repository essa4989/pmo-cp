import { prisma } from "@/lib/db";
import GlossaryBrowser from "@/components/GlossaryBrowser";

export const metadata = { title: "المسرد" };

export default async function GlossaryPage() {
  const terms = await prisma.glossaryTerm.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold text-ink">مسرد مصطلحات PMI-PMOCP</h1>
      <p className="mt-1 text-sm text-muted">
        {terms.length} مصطلحاً موحّداً، بمصادرها الموثّقة — للرجوع السريع أثناء الدراسة والمراجعة.
      </p>
      <GlossaryBrowser terms={terms} />
    </div>
  );
}
