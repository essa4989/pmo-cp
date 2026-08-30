import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs";
import path from "node:path";
// @ts-expect-error — no bundled types for this package
import { convertArabic } from "arabic-reshaper";

const NAVY = rgb(0x0a / 255, 0x2a / 255, 0x35 / 255);
const GOLD = rgb(0xc0 / 255, 0x8a / 255, 0x3e / 255);
const MUTED = rgb(0x5b / 255, 0x6b / 255, 0x76 / 255);
const LINE = rgb(0xdd / 255, 0xe5 / 255, 0xea / 255);

const ARABIC_RE = /[؀-ۿݐ-ݿ]/;
const NEUTRAL_RE = /[\s.,:;!?()«»"'\-™×%]/;

type Run = { text: string; rtl: boolean };

// Splits a line into alternating Arabic (RTL) and Latin/digit (LTR) runs so
// embedded trademarks/acronyms (e.g. "PMI-PMOCP™") inside an Arabic sentence
// don't get character-reversed into gibberish along with the Arabic text.
// Neutral characters (spaces, punctuation) attach to whichever run they're
// adjacent to. This is a simplified bidi pass for single-line, non-nested
// text — enough for certificate copy, not a general bidi implementation.
function splitBidiRuns(text: string): Run[] {
  const runs: Run[] = [];
  let current = "";
  let currentRtl: boolean | null = null;

  for (const ch of text) {
    const isArabic = ARABIC_RE.test(ch);
    const isNeutral = !isArabic && NEUTRAL_RE.test(ch);
    const charRtl: boolean = isNeutral ? currentRtl ?? true : isArabic;

    if (currentRtl === null) {
      currentRtl = charRtl;
      current = ch;
    } else if (charRtl === currentRtl) {
      current += ch;
    } else {
      runs.push({ text: current, rtl: currentRtl });
      current = ch;
      currentRtl = charRtl;
    }
  }
  if (current) runs.push({ text: current, rtl: currentRtl ?? true });
  return runs;
}

function shapeArabic(text: string): string {
  const shaped: string = convertArabic(text);
  return [...shaped].reverse().join("");
}

// Renders a line with an RTL base direction (Arabic paragraph), centered on
// centerX. Each run picks the matching font/size; Arabic runs are reshaped
// and reversed, Latin/digit runs are drawn as-is, and the runs themselves
// are laid out in reverse (RTL) order.
function drawBidiCentered(
  page: PDFPage,
  text: string,
  opts: {
    centerX: number;
    y: number;
    size: number;
    arabicFont: PDFFont;
    latinFont: PDFFont;
    color?: ReturnType<typeof rgb>;
  }
) {
  const color = opts.color ?? NAVY;
  const runs = splitBidiRuns(text);
  const prepared = runs.map((run) => {
    const display = run.rtl ? shapeArabic(run.text) : run.text;
    const font = run.rtl ? opts.arabicFont : opts.latinFont;
    const width = font.widthOfTextAtSize(display, opts.size);
    return { display, font, width };
  });

  const totalWidth = prepared.reduce((sum, r) => sum + r.width, 0);
  let x = opts.centerX - totalWidth / 2;
  // RTL paragraph: visual run order is the reverse of logical run order.
  for (const run of [...prepared].reverse()) {
    page.drawText(run.display, { x, y: opts.y, size: opts.size, font: run.font, color });
    x += run.width;
  }
}

function drawLatinCentered(
  page: PDFPage,
  text: string,
  { centerX, y, size, font, color = MUTED }: { centerX: number; y: number; size: number; font: PDFFont; color?: ReturnType<typeof rgb> }
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}

export async function generateCertificatePdf(opts: {
  learnerName: string;
  courseTitleAr: string;
  courseTitleEn: string;
  issuedAt: Date;
  code: string;
  verifyUrl: string;
}): Promise<Uint8Array> {
  const fontsDir = path.join(process.cwd(), "assets", "fonts");
  const [amiriRegularBytes, amiriBoldBytes] = await Promise.all([
    fs.promises.readFile(path.join(fontsDir, "Amiri-Regular.ttf")),
    fs.promises.readFile(path.join(fontsDir, "Amiri-Bold.ttf")),
  ]);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const arabicRegular = await pdfDoc.embedFont(amiriRegularBytes);
  const arabicBold = await pdfDoc.embedFont(amiriBoldBytes);
  const latin = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const latinRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const width = 841.89; // A4 landscape
  const height = 595.28;
  const page = pdfDoc.addPage([width, height]);
  const centerX = width / 2;

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: NAVY,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: GOLD,
    borderWidth: 1,
  });

  // Header
  drawLatinCentered(page, "PMI-PMOCP SELF-STUDY ACADEMY", {
    centerX,
    y: height - 95,
    size: 12,
    font: latin,
    color: GOLD,
  });
  drawBidiCentered(page, "أكاديمية PMI-PMOCP للتعلّم الذاتي", {
    centerX,
    y: height - 118,
    size: 15,
    arabicFont: arabicBold,
    latinFont: latin,
    color: NAVY,
  });

  // Title
  drawBidiCentered(page, "شهادة إتمام البرنامج", {
    centerX,
    y: height - 175,
    size: 30,
    arabicFont: arabicBold,
    latinFont: latin,
    color: NAVY,
  });
  drawLatinCentered(page, "CERTIFICATE OF COMPLETION", {
    centerX,
    y: height - 200,
    size: 13,
    font: latinRegular,
    color: MUTED,
  });

  drawBidiCentered(page, "تشهد الأكاديمية بأنّ", {
    centerX,
    y: height - 250,
    size: 13,
    arabicFont: arabicRegular,
    latinFont: latinRegular,
    color: MUTED,
  });

  // Learner name
  drawBidiCentered(page, opts.learnerName, {
    centerX,
    y: height - 290,
    size: 26,
    arabicFont: arabicBold,
    latinFont: latin,
    color: NAVY,
  });
  page.drawLine({
    start: { x: centerX - 180, y: height - 302 },
    end: { x: centerX + 180, y: height - 302 },
    thickness: 1,
    color: LINE,
  });

  drawBidiCentered(page, "قد أكمل بنجاح برنامج التعلّم الذاتي للتحضير لشهادة", {
    centerX,
    y: height - 335,
    size: 13,
    arabicFont: arabicRegular,
    latinFont: latinRegular,
    color: MUTED,
  });
  drawLatinCentered(page, "PMI-PMOCP", {
    centerX,
    y: height - 358,
    size: 16,
    font: latin,
    color: NAVY,
  });

  // Disclaimer
  drawBidiCentered(
    page,
    "شهادة إتمام داخلية صادرة عن هذه المنصّة، وليست شهادة PMI-PMOCP الرسمية ولا تمنحها PMI أو تعتمدها.",
    {
      centerX,
      y: height - 400,
      size: 9.5,
      arabicFont: arabicRegular,
      latinFont: latinRegular,
      color: MUTED,
    }
  );

  // Footer: date + code
  const dateStr = opts.issuedAt.toLocaleDateString("en-CA");
  drawLatinCentered(page, `Issued: ${dateStr}`, {
    centerX: centerX - 220,
    y: 70,
    size: 10,
    font: latinRegular,
    color: MUTED,
  });
  drawLatinCentered(page, `Verify: ${opts.verifyUrl.replace(/^https?:\/\//, "")}`, {
    centerX,
    y: 70,
    size: 10,
    font: latinRegular,
    color: MUTED,
  });
  drawLatinCentered(page, opts.code, {
    centerX: centerX + 220,
    y: 70,
    size: 10,
    font: latin,
    color: NAVY,
  });

  return pdfDoc.save();
}
