// lib/types.ts
export type EntryType = "word" | "phrase";

export type Weakness = {
  stage: number;      // 0, 1, 2, 3, 5, 6, 7
  streak: number;    // 連続正解数（弱点復習用）
  updatedAt: number; // ms
};

export type SentenceData = {
  id: string;
  en: string;
  ja: string;
  tokens: string[];

  // Stage5（word用：通常1つ）
  s5?: { targetTokenIndexes: number[] };

  // Stage6（word: 3固定 / phrase: 2以上・上限なし）
  s6?: { blankTokenIndexes: number[] };
};

export type WordData = {
  id: string;
  entryType: EntryType;

  word: string;
  meaning: string;
  qaMemo?: string

  sentences: SentenceData[];

  // 学習進行
  currentStage: number;
  stageStreak: number;

  // SRS / 定着度
  stability: number;
  dueAt: number;

  weakness?: Weakness;

  // タイムスタンプ
  createdAt: number; // ms
  updatedAt: number; // ms
};
