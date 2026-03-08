import Dexie, { type Table } from "dexie";
import type { WordData } from "./types";

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  count: number;
}

export class WordloomDB extends Dexie {
  words!: Table<WordData, string>;
  dailyProgress!: Table<DailyProgress, string>;

  constructor() {
    super("WordloomDB");

    // Define table schemas
    this.version(1).stores({
      words: "id, entryType, currentStage, stability, dueAt, createdAt, updatedAt",
      dailyProgress: "date"
    });

    this.on("ready", async () => {
      // Only execute in the browser
      if (typeof window === "undefined" || !window.localStorage) return;

      // 1. Migrate Words
      const WORDS_KEY = "wordloom.words.v1";
      const WORDS_BACKUP_KEY = "wordloom.words.v1.backup";
      const rawWords = window.localStorage.getItem(WORDS_KEY);

      if (rawWords) {
        try {
          const wordsCount = await this.words.count();
          if (wordsCount === 0) {
            // DB is empty, migrate
            const parsedWords = JSON.parse(rawWords);
            if (Array.isArray(parsedWords)) {
              await this.words.bulkAdd(parsedWords);
              console.log(`Migrated ${parsedWords.length} words to Dexie`);
              
              // Rename to backup as requested by user
              window.localStorage.setItem(WORDS_BACKUP_KEY, rawWords);
              window.localStorage.removeItem(WORDS_KEY);
            }
          }
        } catch (err) {
          console.error("Failed to migrate words to IndexedDB:", err);
        }
      }

      // 2. Migrate Daily Progress
      const PROGRESS_KEY = "wordloom.daily-progress.v1";
      const PROGRESS_BACKUP_KEY = "wordloom.daily-progress.v1.backup";
      const rawProgress = window.localStorage.getItem(PROGRESS_KEY);

      if (rawProgress) {
        try {
          const progressCount = await this.dailyProgress.count();
          if (progressCount === 0) {
            // DB is empty, migrate
            const parsedProgress = JSON.parse(rawProgress);
            // Ensure it has the correct shape
            if (parsedProgress && parsedProgress.date && typeof parsedProgress.count === "number") {
              await this.dailyProgress.add(parsedProgress);
              console.log(`Migrated daily progress for ${parsedProgress.date} to Dexie`);
              
              window.localStorage.setItem(PROGRESS_BACKUP_KEY, rawProgress);
              window.localStorage.removeItem(PROGRESS_KEY);
            }
          }
        } catch (err) {
          console.error("Failed to migrate progress to IndexedDB:", err);
        }
      }
    });
  }
}

export const db = new WordloomDB();
