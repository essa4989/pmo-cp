"use client";

import { useState } from "react";
import LessonListen from "@/components/LessonListen";
import LessonPodcast from "@/components/LessonPodcast";
import type { DialogueTurn } from "@/lib/podcastScript";

export default function LessonAudioTabs({
  lessonCode,
  text,
  turns,
}: {
  lessonCode: string;
  text: string;
  turns: DialogueTurn[];
}) {
  const [tab, setTab] = useState<"read" | "podcast">("podcast");

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand-700">
        <span>🎧</span>
        <span>استماع للدرس — خيار موازٍ للقراءة</span>
      </div>
      <div className="mb-2 flex gap-1 rounded-lg bg-surface-2 p-1 text-xs">
        <button
          onClick={() => setTab("podcast")}
          className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition ${
            tab === "podcast" ? "bg-brand-700 text-white" : "text-muted hover:text-ink"
          }`}
        >
          🎙️ نقاش بين متحدّثين (بودكاست)
        </button>
        <button
          onClick={() => setTab("read")}
          className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition ${
            tab === "read" ? "bg-brand-700 text-white" : "text-muted hover:text-ink"
          }`}
        >
          📖 قراءة صوتية مباشرة
        </button>
      </div>
      {tab === "podcast" ? <LessonPodcast lessonCode={lessonCode} turns={turns} /> : <LessonListen text={text} />}
    </div>
  );
}
