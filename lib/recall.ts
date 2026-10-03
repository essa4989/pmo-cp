import { htmlToText } from "@/lib/tts";

export type RecallPair = { question: string; answer: string };

// Pulls the lesson's own "active recall" Q&A straight out of its
// already-authored content_html (the .recall / .ans divs every lesson
// is written with) — never invents new questions or answers, just
// re-surfaces the exact verified text for spaced-repetition review.
export function extractRecallPairs(contentHtml: string): RecallPair[] {
  const recallMatch = contentHtml.match(/<div class="recall">([\s\S]*?)<\/div>/);
  const ansMatch = contentHtml.match(/<div class="ans">([\s\S]*?)<\/div>/);
  if (!recallMatch || !ansMatch) return [];

  const questions = [...recallMatch[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) =>
    htmlToText(m[1])
  );
  if (questions.length === 0) return [];

  // Answers are a single run of text numbered with Arabic-indic digits,
  // e.g. "١) ... ٢) ... ٣) ...". A digit run only counts as a marker when
  // it's preceded by whitespace/"(" and followed by ")"+space — otherwise
  // an in-text reference like "(المجال V ت٣)" gets mistaken for one.
  const ansText = " " + ansMatch[1].replace(/^<b>[^<]*<\/b>\s*/, "");
  const markerRe = /[\s(]([٠-٩]+)\)\s/g;
  const markers: { start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(ansText))) {
    markers.push({ start: m.index, end: m.index + m[0].length });
  }

  const answers = markers.map((marker, i) => {
    const end = i + 1 < markers.length ? markers[i + 1].start : ansText.length;
    return htmlToText(ansText.slice(marker.end, end));
  });

  if (answers.length !== questions.length) return [];
  return questions.map((question, i) => ({ question, answer: answers[i] }));
}
