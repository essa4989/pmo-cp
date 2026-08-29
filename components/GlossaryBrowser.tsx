"use client";

import { useMemo, useState } from "react";
import { Card, Badge } from "@/components/ui";

type Term = { id: string; termAr: string; termEn: string; definition: string; sourceTag: string };

export default function GlossaryBrowser({ terms }: { terms: Term[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return terms;
    return terms.filter(
      (t) => t.termAr.includes(search.trim()) || t.termEn.toLowerCase().includes(s) || t.definition.includes(search.trim())
    );
  }, [terms, search]);

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث عن مصطلح..."
        className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-sm"
      />
      <div className="mt-4 flex flex-col gap-2">
        {filtered.map((t) => (
          <Card key={t.id} className="!p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-display font-bold text-ink">{t.termAr}</span>
                <span className="ltr-num ms-2 text-sm text-brand-600">{t.termEn}</span>
              </div>
              <Badge tone="muted">{t.sourceTag}</Badge>
            </div>
            <p className="mt-1.5 text-sm leading-7 text-muted">{t.definition}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
