export const ROLES = ["STUDENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STUDY_PLAN_LENGTHS = ["DAYS_30", "DAYS_60", "DAYS_90"] as const;
export type StudyPlanLength = (typeof STUDY_PLAN_LENGTHS)[number];

export const ATTEMPT_MODES = [
  "PRACTICE",
  "DOMAIN_QUIZ",
  "EXAM_MODE",
  "MOCK_EXAM",
] as const;
export type AttemptMode = (typeof ATTEMPT_MODES)[number];

export const ATTEMPT_STATUSES = ["IN_PROGRESS", "SUBMITTED"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const LESSON_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export const FLASHCARD_RESULTS = ["AGAIN", "HARD", "GOOD", "EASY"] as const;
export type FlashcardResult = (typeof FLASHCARD_RESULTS)[number];

export const SOURCE_TYPES = [
  "PMI_OFFICIAL",
  "PMI_REFERENCE",
  "TRAINING",
  "PMBOK7",
  "PMBOK8_SUPPORTING",
  "ACADEMIC",
  "UNVERIFIED",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
