import { htmlToText } from "@/lib/tts";
import { extractRecallPairs } from "@/lib/recall";

export type DialogueTurn = { speaker: "A" | "B"; text: string };

type Section = { heading: string; bodyHtml: string };

// Walks the lesson's own <h4> headings in document order and captures
// everything up to the next one as that section's body. Lesson headings
// are NOT standardized across the curriculum ("المفهوم" vs "المفهوم والتطبيق"
// vs "مثال — مؤسسة حكومية", etc.), so this stays purely structural instead
// of pattern-matching specific heading text, which would silently drop
// content on lessons that phrase a heading differently.
function splitSections(html: string): Section[] {
  const matches = [...html.matchAll(/<h4>([^<]*)<\/h4>/g)];
  const sections: Section[] = [];
  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i][1].trim();
    const bodyStart = matches[i].index! + matches[i][0].length;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    sections.push({ heading, bodyHtml: html.slice(bodyStart, bodyEnd) });
  }
  return sections;
}

const SKIP_HEADINGS = /^(الأهداف|الأهداف التعليمية|المراجع)$/;
const TRAP_HEADING = /فخّ|⚠|تصحيح|تنبيه/;
const RECALL_HEADING = /استرجاع/;

function trapCue(): string {
  return "طيب وما أخطر فخّ ممكن يقع فيه أحد بالامتحان هنا؟";
}

function genericCue(heading: string): string {
  const clean = heading.replace(/[؟?]+$/, "");
  return `طيب وضّح لي أكثر — ${clean}؟`;
}

// Restructures the lesson's own verified sentences into a two-person,
// podcast-style back-and-forth — never adds a new PMI fact, only
// reframes real sections as B asking and A answering (plus light
// connective phrases that carry no factual claim of their own).
export function buildPodcastScript(lesson: {
  titleAr: string;
  summaryAr: string;
  keyFactsAr: string;
  contentHtml: string;
}): DialogueTurn[] {
  const turns: DialogueTurn[] = [];

  turns.push({ speaker: "A", text: `أهلاً، خلّنا اليوم نتكلّم عن درس "${lesson.titleAr}".` });
  if (lesson.summaryAr) {
    turns.push({ speaker: "B", text: "تمام، أعطني خلاصة سريعة قبل ما نبدأ." });
    turns.push({ speaker: "A", text: lesson.summaryAr });
  }

  const sections = splitSections(lesson.contentHtml);
  let recallHandled = false;

  for (const section of sections) {
    if (SKIP_HEADINGS.test(section.heading)) continue;

    if (RECALL_HEADING.test(section.heading)) {
      if (recallHandled) continue;
      recallHandled = true;
      const pairs = extractRecallPairs(lesson.contentHtml).slice(0, 3);
      for (const pair of pairs) {
        turns.push({ speaker: "B", text: pair.question });
        turns.push({ speaker: "A", text: pair.answer });
      }
      continue;
    }

    const bodyText = htmlToText(section.bodyHtml);
    if (!bodyText) continue;

    const cue = TRAP_HEADING.test(section.heading) ? trapCue() : genericCue(section.heading);
    turns.push({ speaker: "B", text: cue });
    turns.push({ speaker: "A", text: bodyText });
  }

  turns.push({ speaker: "B", text: "تمام، استوعبت الفكرة. شكراً على التوضيح." });
  turns.push({ speaker: "A", text: "العفو، ننتقل للدرس الجاي." });

  return turns;
}
