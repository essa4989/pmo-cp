"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DialogueTurn } from "@/lib/podcastScript";

type PlayState = "idle" | "playing" | "paused" | "error";
type AudioMode = "checking" | "ai" | "browser";

const SPEAKER_LABEL: Record<"A" | "B", string> = { A: "المتحدّث ١", B: "المتحدّث ٢" };
// Two distinct pitch/rate profiles so the two speakers sound different even
// when the device only has one Arabic voice installed.
const SPEAKER_VOICE_PROFILE: Record<"A" | "B", { pitch: number; rate: number }> = {
  A: { pitch: 0.85, rate: 1 },
  B: { pitch: 1.25, rate: 1.05 },
};

// Splits each turn into speech-friendly chunks (long turns can hit
// per-utterance limits some browsers impose) while keeping every chunk
// tagged to its original speaker so voices never bleed across turns.
function chunkTurns(turns: DialogueTurn[], maxLen = 220): { speaker: "A" | "B"; text: string }[] {
  const chunks: { speaker: "A" | "B"; text: string }[] = [];
  for (const turn of turns) {
    const sentences = turn.text
      .split(/(?<=[.!?؟!،؛\n])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    let current = "";
    for (const s of sentences) {
      if ((current + " " + s).trim().length > maxLen && current) {
        chunks.push({ speaker: turn.speaker, text: current.trim() });
        current = s;
      } else {
        current = (current + " " + s).trim();
      }
    }
    if (current) chunks.push({ speaker: turn.speaker, text: current.trim() });
  }
  return chunks;
}

export default function LessonPodcast({ lessonCode, turns }: { lessonCode: string; turns: DialogueTurn[] }) {
  const [mode, setMode] = useState<AudioMode>("checking");
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<PlayState>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  // "" means "auto-pick" — explicit choices are remembered per browser so a
  // learner who picks voices once doesn't have to redo it on every lesson.
  const [voiceAURI, setVoiceAURI] = useState("");
  const [voiceBURI, setVoiceBURI] = useState("");

  const chunks = useMemo(() => chunkTurns(turns), [turns]);
  const indexRef = useRef(0);
  const voicesRef = useRef<[SpeechSynthesisVoice | null, SpeechSynthesisVoice | null]>([null, null]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const savedA = localStorage.getItem("pmocp_podcast_voiceA");
        const savedB = localStorage.getItem("pmocp_podcast_voiceB");
        if (savedA) setVoiceAURI(savedA);
        if (savedB) setVoiceBURI(savedB);
      } catch {
        // localStorage unavailable (private mode, blocked site data, ...) —
        // auto-pick stays the default, nothing else to do.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function chooseVoice(speaker: "A" | "B", uri: string) {
    if (speaker === "A") setVoiceAURI(uri);
    else setVoiceBURI(uri);
    try {
      localStorage.setItem(speaker === "A" ? "pmocp_podcast_voiceA" : "pmocp_podcast_voiceB", uri);
    } catch {
      // Best-effort only — the in-memory state above still works this session.
    }
  }

  // Probe the optional server-generated AI voice track once; if it's not
  // configured (no API key on the server) or fails, fall straight through
  // to the always-available free browser dialogue playback below.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lesson/${lessonCode}/podcast`, { method: "HEAD" })
      .then((res) => {
        // 204 means the server has no AI audio for this lesson (no API key
        // configured, or generation failed) — only a real 200 has audio.
        if (!cancelled) setMode(res.status === 200 ? "ai" : "browser");
      })
      .catch(() => {
        if (!cancelled) setMode("browser");
      });
    return () => {
      cancelled = true;
    };
  }, [lessonCode]);

  useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      Promise.resolve().then(() => {
        if (!cancelled) setSupported(false);
      });
      return () => {
        cancelled = true;
      };
    }
    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      if (!cancelled) setVoices(all);
    };
    Promise.resolve().then(loadVoices);
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      cancelled = true;
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const arabicVoices = useMemo(() => voices.filter((v) => v.lang.toLowerCase().startsWith("ar")), [voices]);
  // Arabic voices first (most relevant), then the rest — same list for both
  // speaker pickers so a learner can also deliberately pick two non-Arabic
  // voices if that's what sounds best on their device.
  const pickableVoices = useMemo(() => {
    const arabicSet = new Set(arabicVoices);
    return [...arabicVoices, ...voices.filter((v) => !arabicSet.has(v))];
  }, [arabicVoices, voices]);

  useEffect(() => {
    const pool = arabicVoices.length > 0 ? arabicVoices : voices;
    // Explicit picks win; otherwise auto-pick two distinct installed voices
    // when available, falling back to one voice (pitch/rate still differs).
    const auto: [SpeechSynthesisVoice | null, SpeechSynthesisVoice | null] = [
      pool[0] ?? null,
      pool[1] ?? pool[0] ?? null,
    ];
    const chosenA = voices.find((v) => v.voiceURI === voiceAURI) ?? auto[0];
    const chosenB = voices.find((v) => v.voiceURI === voiceBURI) ?? auto[1];
    voicesRef.current = [chosenA, chosenB];
  }, [arabicVoices, voices, voiceAURI, voiceBURI]);

  function speakBrowserFrom(index: number) {
    const synth = window.speechSynthesis;
    synth.cancel();
    indexRef.current = index;

    const speakNext = () => {
      const i = indexRef.current;
      const chunk = chunks[i];
      if (!chunk) {
        setState("idle");
        setTurnIndex(0);
        return;
      }
      setTurnIndex(i);
      const voicePool = voicesRef.current;
      const voice = chunk.speaker === "A" ? voicePool[0] : voicePool[1] ?? voicePool[0];
      const profile = SPEAKER_VOICE_PROFILE[chunk.speaker];

      const utter = new SpeechSynthesisUtterance(chunk.text);
      utter.lang = voice?.lang || "ar-SA";
      if (voice) utter.voice = voice;
      utter.pitch = profile.pitch;
      utter.rate = profile.rate;
      utter.onend = () => {
        indexRef.current += 1;
        if (indexRef.current < chunks.length) {
          speakNext();
        } else {
          setState("idle");
          setTurnIndex(0);
        }
      };
      utter.onerror = (e) => {
        if (e.error === "canceled" || e.error === "interrupted") return;
        setState("error");
      };
      synth.speak(utter);
    };
    speakNext();
    setState("playing");
  }

  function play() {
    if (mode === "ai" && audioRef.current) {
      audioRef.current.play().catch(() => setState("error"));
      setState("playing");
      return;
    }
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }
    speakBrowserFrom(0);
  }

  function pause() {
    if (mode === "ai" && audioRef.current) {
      audioRef.current.pause();
      setState("paused");
      return;
    }
    window.speechSynthesis.pause();
    setState("paused");
  }

  function stop() {
    if (mode === "ai" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setState("idle");
    setTurnIndex(0);
  }

  if (mode === "checking") {
    return <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">جارٍ تحضير البودكاست…</div>;
  }

  if (mode === "browser" && !supported) {
    return (
      <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
        متصفحك الحالي لا يدعم الاستماع الصوتي (Text-to-Speech).
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-line bg-[var(--bad-bg)] p-3 text-xs text-[var(--bad)]">
        تعذّر تشغيل البودكاست على هذا الجهاز/المتصفح.{" "}
        <button onClick={() => setState("idle")} className="font-semibold underline">
          حاول مجدداً
        </button>
      </div>
    );
  }

  const currentChunk = chunks[turnIndex];

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      {mode === "ai" && (
        <audio
          ref={audioRef}
          src={`/api/lesson/${lessonCode}/podcast`}
          onEnded={() => setState("idle")}
          onError={() => setState("error")}
          className="hidden"
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {state !== "playing" ? (
            <button
              onClick={play}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800"
              aria-label="تشغيل"
            >
              ▶
            </button>
          ) : (
            <button
              onClick={pause}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800"
              aria-label="إيقاف مؤقّت"
            >
              ❚❚
            </button>
          )}
          <button
            onClick={stop}
            disabled={state === "idle"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink disabled:opacity-40"
            aria-label="إيقاف"
          >
            ◼
          </button>
        </div>

        <button
          onClick={() => setShowTranscript((s) => !s)}
          className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:text-ink"
        >
          {showTranscript ? "إخفاء النص" : "عرض النص"}
        </button>

        <span className="ms-auto text-[11px] text-muted">
          {mode === "ai" ? "🤖 صوت AI" : "🔊 صوت المتصفح (مجاني)"}
        </span>
      </div>

      {mode === "browser" && pickableVoices.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            صوت {SPEAKER_LABEL.A}
            <select
              value={voiceAURI}
              onChange={(e) => chooseVoice("A", e.target.value)}
              className="rounded-lg border border-line px-2 py-1.5 text-xs text-ink"
            >
              <option value="">تلقائي</option>
              {pickableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            صوت {SPEAKER_LABEL.B}
            <select
              value={voiceBURI}
              onChange={(e) => chooseVoice("B", e.target.value)}
              className="rounded-lg border border-line px-2 py-1.5 text-xs text-ink"
            >
              <option value="">تلقائي</option>
              {pickableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {mode === "browser" && showTranscript && currentChunk && state !== "idle" && (
        <p className="mt-3 rounded-lg bg-surface-2 p-2 text-xs leading-6 text-ink">
          <span className="font-semibold text-brand-700">{SPEAKER_LABEL[currentChunk.speaker]}: </span>
          {currentChunk.text}
        </p>
      )}

      {mode === "browser" && showTranscript && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-line p-2 text-xs leading-6">
          {turns.map((t, i) => (
            <p key={i} className={t.speaker === "A" ? "text-ink" : "text-muted"}>
              <span className="font-semibold">{SPEAKER_LABEL[t.speaker]}: </span>
              {t.text}
            </p>
          ))}
        </div>
      )}

      {mode === "browser" && arabicVoices.length === 0 && (
        <p className="mt-2 text-[11px] text-muted">
          لم يُعثر على صوت عربي على هذا الجهاز — سيُستخدم أقرب صوت متاح مع اختلاف في طبقة الصوت بين
          المتحدّثين.
        </p>
      )}
    </div>
  );
}
