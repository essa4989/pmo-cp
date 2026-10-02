// Converts the lesson's rich HTML (plus its summary/title/key-facts) into
// clean prose suitable for text-to-speech — same verified text as the
// reading view, just linearized, with the EN/number spans and leftover
// markup tags dropped since they add no value when spoken aloud.
export function lessonTextForSpeech(opts: {
  titleAr: string;
  summaryAr: string;
  keyFactsAr: string;
  contentHtml: string;
}): string {
  const bodyText = opts.contentHtml
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

  return [opts.titleAr, opts.summaryAr, opts.keyFactsAr, bodyText]
    .filter(Boolean)
    .join("\n");
}
