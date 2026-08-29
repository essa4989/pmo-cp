"use client";

import { useEffect, useRef } from "react";
import { markLessonStarted } from "@/lib/actions/lesson";

export default function MarkStarted({ lessonId }: { lessonId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    markLessonStarted(lessonId).catch(() => {});
  }, [lessonId]);
  return null;
}
