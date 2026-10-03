// Converts rich lesson HTML into clean, speakable plain text — same verified
// text as the reading view, just linearized, with markup and entities decoded
// since they add no value (or get read aloud literally) when spoken.
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|div|tr)>/gi, "$&\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function lessonTextForSpeech(opts: {
  titleAr: string;
  summaryAr: string;
  keyFactsAr: string;
  contentHtml: string;
}): string {
  const bodyText = htmlToText(opts.contentHtml);
  return [opts.titleAr, opts.summaryAr, opts.keyFactsAr, bodyText].filter(Boolean).join("\n");
}
