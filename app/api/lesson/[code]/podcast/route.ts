import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrGeneratePodcastAudio } from "@/lib/podcastAudio";

// Returns the optional AI-generated podcast narration for a lesson when the
// deployment has OPENAI_API_KEY configured (cached after the first request);
// otherwise 204, so the client falls back to the free browser voice player.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { code } });
  if (!lesson) return NextResponse.json({ error: "not found" }, { status: 404 });

  const result = await getOrGeneratePodcastAudio(code, {
    titleAr: lesson.titleAr,
    summaryAr: lesson.summaryAr,
    keyFactsAr: lesson.keyFactsAr,
    contentHtml: lesson.contentHtml,
  });

  if (!result) return new NextResponse(null, { status: 204 });

  return new NextResponse(Buffer.from(result.audio), {
    headers: {
      "Content-Type": result.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function HEAD(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const res = await GET(req, ctx);
  return new NextResponse(null, { status: res.status, headers: res.headers });
}
