"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PlayState = "idle" | "playing" | "paused" | "error";

const RATES = [0.85, 1, 1.15, 1.3];

// Splits into speech-friendly chunks so long lessons don't hit per-utterance
// limits/cutoffs some browsers impose, and so pause/resume stays responsive.
function chunkText(text: string, maxLen = 220): string[] {
  const sentences = text
    .split(/(?<=[.!?؟!،؛\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).trim().length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = (current + " " + s).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export default function LessonListen({ text }: { text: string }) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<PlayState>("idle");
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

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
    chunksRef.current = chunkText(text);

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
  }, [text]);

  const arabicVoices = useMemo(() => voices.filter((v) => v.lang.toLowerCase().startsWith("ar")), [voices]);
  const bestDefaultVoice = arabicVoices[0] ?? voices[0] ?? null;

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    const chosen = voices.find((v) => v.voiceURI === voiceURI) ?? bestDefaultVoice;
    voiceRef.current = chosen;
  }, [voiceURI, voices, bestDefaultVoice]);

  function speakFrom(index: number) {
    const synth = window.speechSynthesis;
    synth.cancel();
    indexRef.current = index;

    const speakNext = () => {
      const i = indexRef.current;
      const chunk = chunksRef.current[i];
      if (!chunk) {
        setState("idle");
        setProgress(0);
        return;
      }
      const utter = new SpeechSynthesisUtterance(chunk);
      utter.lang = voiceRef.current?.lang || "ar-SA";
      if (voiceRef.current) utter.voice = voiceRef.current;
      utter.rate = rateRef.current;
      utter.onend = () => {
        indexRef.current += 1;
        setProgress(indexRef.current / chunksRef.current.length);
        if (indexRef.current < chunksRef.current.length) {
          speakNext();
        } else {
          setState("idle");
          setProgress(0);
        }
      };
      utter.onerror = (e) => {
        // "canceled"/"interrupted" are expected whenever we call
        // synth.cancel() ourselves (stop, or starting a new utterance) —
        // only genuine failures should surface as a visible error state.
        if (e.error === "canceled" || e.error === "interrupted") return;
        setState("error");
      };
      synth.speak(utter);
    };
    speakNext();
    setState("playing");
  }

  function play() {
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }
    speakFrom(0);
  }

  function pause() {
    window.speechSynthesis.pause();
    setState("paused");
  }

  function stop() {
    window.speechSynthesis.cancel();
    setState("idle");
    setProgress(0);
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
        متصفحك الحالي لا يدعم الاستماع الصوتي (Text-to-Speech).
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-line bg-[var(--bad-bg)] p-3 text-xs text-[var(--bad)]">
        تعذّر تشغيل الاستماع الصوتي على هذا الجهاز/المتصفح. جرّب متصفحاً آخر (مثل Chrome أو
        Edge) أو تأكّد من توفّر محرّك نطق على نظامك.{" "}
        <button onClick={() => setState("idle")} className="font-semibold underline">
          حاول مجدداً
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
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

        <div className="h-1.5 flex-1 min-w-[80px] overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <select
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="ltr-num rounded-lg border border-line px-2 py-1 text-xs"
        >
          {RATES.map((r) => (
            <option key={r} value={r}>
              {r}x
            </option>
          ))}
        </select>

        {voices.length > 0 && (
          <select
            value={voiceURI}
            onChange={(e) => setVoiceURI(e.target.value)}
            className="max-w-[160px] rounded-lg border border-line px-2 py-1 text-xs text-ink"
          >
            <option value="">{bestDefaultVoice ? bestDefaultVoice.name : "الصوت الافتراضي"}</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}
      </div>

      {arabicVoices.length === 0 && (
        <p className="mt-2 text-[11px] text-muted">
          لم يُعثر على صوت عربي على هذا الجهاز/المتصفح — سيُستخدم أقرب صوت متاح. جرّب متصفحاً أو
          جهازاً آخر لصوت عربي أوضح.
        </p>
      )}
    </div>
  );
}
