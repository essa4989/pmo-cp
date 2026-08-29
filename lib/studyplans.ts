export type PlanRange = { from: number; to: number; moduleId: number | "final"; mock?: 1 | 2 | 3 };

export const STUDY_PLANS: Record<
  "DAYS_30" | "DAYS_60" | "DAYS_90",
  { days: number; hoursPerDay: string; labelAr: string; ranges: PlanRange[] }
> = {
  DAYS_30: {
    days: 30,
    hoursPerDay: "٣ ساعات يومياً",
    labelAr: "٣٠ يوماً · مكثّفة",
    ranges: [
      { from: 1, to: 3, moduleId: 0 },
      { from: 4, to: 8, moduleId: 1 },
      { from: 9, to: 13, moduleId: 2 },
      { from: 14, to: 18, moduleId: 3, mock: 1 },
      { from: 19, to: 21, moduleId: 4 },
      { from: 22, to: 26, moduleId: 5 },
      { from: 27, to: 28, moduleId: 6, mock: 2 },
      { from: 29, to: 30, moduleId: "final", mock: 3 },
    ],
  },
  DAYS_60: {
    days: 60,
    hoursPerDay: "١٫٥–٢ ساعة يومياً",
    labelAr: "٦٠ يوماً · متوازنة",
    ranges: [
      { from: 1, to: 6, moduleId: 0 },
      { from: 7, to: 16, moduleId: 1 },
      { from: 17, to: 27, moduleId: 2 },
      { from: 28, to: 38, moduleId: 3, mock: 1 },
      { from: 39, to: 45, moduleId: 4 },
      { from: 46, to: 53, moduleId: 5 },
      { from: 54, to: 57, moduleId: 6, mock: 2 },
      { from: 58, to: 60, moduleId: "final", mock: 3 },
    ],
  },
  DAYS_90: {
    days: 90,
    hoursPerDay: "ساعة يومياً",
    labelAr: "٩٠ يوماً · عميقة",
    ranges: [
      { from: 1, to: 9, moduleId: 0 },
      { from: 10, to: 24, moduleId: 1 },
      { from: 25, to: 41, moduleId: 2 },
      { from: 42, to: 58, moduleId: 3, mock: 1 },
      { from: 59, to: 69, moduleId: 4 },
      { from: 70, to: 80, moduleId: 5 },
      { from: 81, to: 86, moduleId: 6, mock: 2 },
      { from: 87, to: 90, moduleId: "final", mock: 3 },
    ],
  },
};

export function dayNumberSince(start: Date): number {
  const ms = Date.now() - start.getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
}

export function findTodayRange(plan: keyof typeof STUDY_PLANS, dayNumber: number): PlanRange {
  const { ranges, days } = STUDY_PLANS[plan];
  const clamped = Math.min(dayNumber, days);
  return ranges.find((r) => clamped >= r.from && clamped <= r.to) ?? ranges[ranges.length - 1];
}
