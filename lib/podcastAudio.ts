import { prisma } from "@/lib/db";
import { buildPodcastScript, type DialogueTurn } from "@/lib/podcastScript";

// Two distinct OpenAI TTS voices so the "discussion between two men" the
// user asked for actually sounds like two different speakers, not one
// voice reading both sides.
const VOICE_BY_SPEAKER: Record<"A" | "B", string> = {
  A: "onyx",
  B: "echo",
};

const STYLE_INSTRUCTIONS =
  "تحدّث بالعربية بلهجة خليجية/سعودية طبيعية، بنغمة محادثة ودّية وغير رسمية كأنك ضيف في حلقة بودكاست، " +
  "بوتيرة متوسطة ونَفَس طبيعي بين الجمل — وليس بنطق تعليمي رسمي جافّ.";

async function synthesizeTurn(turn: DialogueTurn, apiKey: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: VOICE_BY_SPEAKER[turn.speaker],
      input: turn.text,
      instructions: STYLE_INSTRUCTIONS,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI TTS request failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Generates (once) and caches a full two-speaker podcast-style narration of
// a lesson via the OpenAI TTS API — purely optional: only runs when the
// deployment has OPENAI_API_KEY configured, and never invents any PMI
// content itself (the script it narrates comes from buildPodcastScript,
// which only reframes the lesson's own verified text). Any failure falls
// back silently to null so the caller can use the free browser voice
// player instead.
export async function getOrGeneratePodcastAudio(
  lessonCode: string,
  lesson: { titleAr: string; summaryAr: string; keyFactsAr: string; contentHtml: string }
): Promise<{ audio: Buffer; mimeType: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const cached = await prisma.lessonPodcastAudio.findUnique({ where: { lessonCode } });
  if (cached) return { audio: Buffer.from(cached.audioData), mimeType: cached.mimeType };

  try {
    const script = buildPodcastScript(lesson);
    const buffers: Buffer[] = [];
    for (const turn of script) {
      buffers.push(await synthesizeTurn(turn, apiKey));
    }
    const combined = Buffer.concat(buffers);

    await prisma.lessonPodcastAudio.create({
      data: {
        lessonCode,
        audioData: combined,
        script: JSON.stringify(script),
      },
    });

    return { audio: combined, mimeType: "audio/mpeg" };
  } catch (err) {
    console.error("Podcast audio generation failed for", lessonCode, err);
    return null;
  }
}
