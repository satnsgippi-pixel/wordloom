// lib/types.ts
export type EntryType = "word" | "phrase";

export type Weakness = {
  stage: number;      // 0, 1, 2, 3, 5, 6, 7
  streak: number;    // 連続正解数（弱点復習用）
  updatedAt: number; // ms
  /** 間違えた時点の例文ID（弱点復習で同じ例文を出題するため） */
  sentenceId?: string;
};

export type SentenceData = {
  id: string;
  en: string;
  ja: string;
  tokens: string[];

  // Stage5（word用：通常1つ）
  s5?: { targetTokenIndexes: number[] };

  // Stage6（word / phrase 共通: 2以上・任意個）
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
  /** Stage4〜7: 現ステージで正解済みの例文ID（全候補正解で次ステージへ） */
  stageClearedSentenceIds?: string[];

  // SRS / 定着度
  stability: number;
  dueAt: number;

  weakness?: Weakness;

  // タイムスタンプ
  createdAt: number; // ms
  updatedAt: number; // ms
  // 最後に問題を解いた時刻（ms, 任意）
  lastReviewedAt?: number;
};
