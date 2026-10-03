import { prisma } from "@/lib/db";
import { buildPodcastScript, type DialogueTurn } from "@/lib/podcastScript";

// ElevenLabs, not OpenAI: research during development confirmed OpenAI's
// TTS voices are tuned for English with weak Arabic accent control, while
// ElevenLabs ships genuine Saudi-accented Arabic voices (several explicitly
// marketed as male "Saudi narrator / podcast" voices) and a purpose-built
// Text-to-Dialogue endpoint that natively handles multi-speaker turn-taking
// in one request — a direct match for "two Saudi men having a discussion,
// podcast-style". See README section 12 for the exact setup steps.
const DIALOGUE_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-dialogue";
const DIALOGUE_MODEL = "eleven_v3";
// Stays comfortably under ElevenLabs' documented 2000-character-per-request
// limit for text-to-dialogue, leaving margin for request overhead.
const MAX_CHARS_PER_REQUEST = 1800;

type DialogueInput = { text: string; voice_id: string };

function voiceIdForSpeaker(speaker: "A" | "B"): string | null {
  const id = speaker === "A" ? process.env.ELEVENLABS_VOICE_ID_A : process.env.ELEVENLABS_VOICE_ID_B;
  return id && id.trim() ? id.trim() : null;
}

// Splits the script into request-sized batches without ever separating a
// turn's text across two requests (keeps each speaker's sentence intact).
function batchByCharLimit(inputs: DialogueInput[], maxChars: number): DialogueInput[][] {
  const batches: DialogueInput[][] = [];
  let current: DialogueInput[] = [];
  let currentLen = 0;
  for (const input of inputs) {
    if (currentLen + input.text.length > maxChars && current.length > 0) {
      batches.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(input);
    currentLen += input.text.length;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function synthesizeDialogueBatch(inputs: DialogueInput[], apiKey: string): Promise<Buffer> {
  const res = await fetch(DIALOGUE_ENDPOINT, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      model_id: DIALOGUE_MODEL,
      inputs,
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs text-to-dialogue request failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Generates (once) and caches a full two-speaker podcast-style narration of
// a lesson via ElevenLabs — purely optional: only runs when the deployment
// has ELEVENLABS_API_KEY + both voice ids configured, and never invents any
// PMI content itself (the script it narrates comes from buildPodcastScript,
// which only reframes the lesson's own verified text). Any failure falls
// back silently to null so the caller can use the free browser voice
// player instead.
export async function getOrGeneratePodcastAudio(
  lessonCode: string,
  lesson: { titleAr: string; summaryAr: string; keyFactsAr: string; contentHtml: string }
): Promise<{ audio: Buffer; mimeType: string } | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceA = voiceIdForSpeaker("A");
  const voiceB = voiceIdForSpeaker("B");
  if (!apiKey || !voiceA || !voiceB) return null;

  const cached = await prisma.lessonPodcastAudio.findUnique({ where: { lessonCode } });
  if (cached) return { audio: Buffer.from(cached.audioData), mimeType: cached.mimeType };

  try {
    const script: DialogueTurn[] = buildPodcastScript(lesson);
    const inputs: DialogueInput[] = script.map((turn) => ({
      text: turn.text,
      voice_id: turn.speaker === "A" ? voiceA : voiceB,
    }));
    const batches = batchByCharLimit(inputs, MAX_CHARS_PER_REQUEST);

    const buffers: Buffer[] = [];
    for (const batch of batches) {
      buffers.push(await synthesizeDialogueBatch(batch, apiKey));
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
