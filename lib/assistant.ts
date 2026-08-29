import { prisma } from "@/lib/db";

export type AssistantMatch = {
  type: "lesson" | "glossary" | "trap";
  title: string;
  snippet: string;
  href: string;
  sourceTag: string;
  score: number;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Arabic words commonly appear with a leading conjunction ("و") and/or the
// definite article ("ال") attached — e.g. "والاستراتيجية" vs "استراتيجية".
// Plain substring matching misses these, so both the query and the haystack
// are normalized to their bare stems before comparison.
function normalizeWord(word: string): string {
  let w = word;
  w = w.replace(/^[وف](?=ال)/, "");
  w = w.replace(/^ال/, "");
  return w.toLowerCase();
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s.,،؛;:!؟?()«»"'\-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);
}

// Common Arabic function words carry no topical signal and appear in nearly
// every lesson body, so left in the query they drown out real keywords.
const STOPWORDS = new Set(
  [
    "ما", "من", "في", "على", "إلى", "عن", "هل", "هذا", "هذه", "ذلك", "تلك",
    "بين", "مع", "أو", "او", "أن", "ان", "إن", "كل", "أي", "اي", "لا", "لم",
    "لن", "قد", "ثم", "أم", "ام", "كان", "يكون", "الذي", "التي", "هو", "هي",
    "كيف", "لماذا", "متى", "أين", "اين", "الفرق", "يعني", "يعنى", "و", "ف",
  ].map((w) => w)
);

function tokenizeQuery(text: string): string[] {
  return tokenize(text).filter((w) => !STOPWORDS.has(normalizeWord(w)) && !STOPWORDS.has(w));
}

function scoreText(haystack: string, queryTokens: string[]): number {
  const haystackWords = new Set(tokenize(haystack).map(normalizeWord));
  let score = 0;
  for (const tok of queryTokens) {
    const norm = normalizeWord(tok);
    if (haystackWords.has(norm)) {
      score += norm.length * 2; // exact stemmed word match
    } else if (norm.length >= 3 && haystack.toLowerCase().includes(norm)) {
      score += norm.length; // partial/substring match
    }
  }
  return score;
}

function snippetAround(text: string, queryTokens: string[], maxLen = 220): string {
  let idx = -1;
  for (const tok of queryTokens) {
    idx = text.indexOf(tok);
    if (idx !== -1) break;
  }
  if (idx === -1) return text.slice(0, maxLen);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, start + maxLen);
  return (start > 0 ? "… " : "") + text.slice(start, end) + (end < text.length ? " …" : "");
}

// Pure retrieval over the verified curriculum content — never invents text,
// only surfaces and ranks what already exists in the database.
export async function searchCurriculum(query: string, limit = 5): Promise<AssistantMatch[]> {
  const queryTokens = tokenizeQuery(query);
  if (queryTokens.length === 0) return [];

  const [lessons, glossary, traps] = await Promise.all([
    prisma.lesson.findMany({ select: { code: true, titleAr: true, titleEn: true, summaryAr: true, contentHtml: true } }),
    prisma.glossaryTerm.findMany(),
    prisma.examTrap.findMany(),
  ]);

  const matches: AssistantMatch[] = [];

  for (const l of lessons) {
    const plain = `${l.titleAr} ${l.titleEn} ${l.summaryAr} ${stripHtml(l.contentHtml)}`;
    const score = scoreText(plain, queryTokens);
    if (score > 0) {
      matches.push({
        type: "lesson",
        title: `${l.code} · ${l.titleAr}`,
        snippet: snippetAround(stripHtml(l.contentHtml) || l.summaryAr, queryTokens),
        href: `/lesson/${l.code}`,
        sourceTag: "TRAINING",
        score,
      });
    }
  }

  for (const g of glossary) {
    // A direct hit on the term itself matters far more than one buried in a
    // long lesson body, so glossary term matches get a precision bonus.
    const termScore = scoreText(`${g.termAr} ${g.termEn}`, queryTokens) * 2;
    const definitionScore = scoreText(g.definition, queryTokens);
    const score = termScore + definitionScore;
    if (score > 0) {
      matches.push({
        type: "glossary",
        title: `${g.termAr} (${g.termEn})`,
        snippet: g.definition,
        href: `/glossary`,
        sourceTag: g.sourceTag,
        score,
      });
    }
  }

  for (const t of traps) {
    const plain = `${t.trap} ${t.wrongChoice} ${t.correctLogic}`;
    const score = scoreText(plain, queryTokens);
    if (score > 0) {
      matches.push({
        type: "trap",
        title: `فخّ الامتحان: ${t.trap}`,
        snippet: `${t.wrongChoice} ← ${t.correctLogic}`,
        href: `/exam-strategy`,
        sourceTag: "TRAINING",
        score,
      });
    }
  }

  // On a score tie, prefer the more precise short-form sources (a glossary
  // definition or a named exam trap) over an incidental hit inside a long
  // lesson body.
  const typePriority: Record<AssistantMatch["type"], number> = { glossary: 0, trap: 1, lesson: 2 };
  return matches
    .sort((a, b) => b.score - a.score || typePriority[a.type] - typePriority[b.type])
    .slice(0, limit);
}
