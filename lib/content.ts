import fs from "node:fs";
import path from "node:path";

export type CurriculumMeta = {
  version: string;
  eco_version: string;
  pmbok_reference: string;
  source_deck: string;
  prepared_by: string;
  disclaimer: string;
};

export type CurriculumReference = {
  meta: CurriculumMeta;
  strategy_html: string;
  plans_html: string;
  source_validation_html: string;
  source_map_html: string;
  readiness_html: string;
};

let cached: CurriculumReference | null = null;

export function getCurriculumReference(): CurriculumReference {
  if (cached) return cached;
  const raw = fs.readFileSync(path.join(process.cwd(), "content", "curriculum.json"), "utf-8");
  const data = JSON.parse(raw);
  cached = {
    meta: data.meta,
    strategy_html: data.strategy_html,
    plans_html: data.plans_html,
    source_validation_html: data.source_validation_html,
    source_map_html: data.source_map_html,
    readiness_html: data.readiness_html,
  };
  return cached;
}
