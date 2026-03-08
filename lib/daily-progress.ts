import { db, type DailyProgress } from "./db";

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayProgress(): Promise<number> {
  const result = await db.dailyProgress.get(todayKey());
  return result ? result.count : 0;
}

export async function incrementTodayProgress(by = 1): Promise<void> {
  const today = todayKey();
  const current = await db.dailyProgress.get(today);
  
  if (current) {
    await db.dailyProgress.put({ date: today, count: current.count + by });
  } else {
    await db.dailyProgress.add({ date: today, count: by });
  }
}
