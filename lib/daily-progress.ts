const KEY = "wordloom.daily-progress.v1"

type DailyProgress = {
  date: string // YYYY-MM-DD
  count: number
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function getTodayProgress(): number {
  if (typeof window === "undefined") return 0

  const raw = localStorage.getItem(KEY)
  if (!raw) return 0

  try {
    const data: DailyProgress = JSON.parse(raw)
    return data.date === todayKey() ? data.count : 0
  } catch {
    return 0
  }
}

export function incrementTodayProgress(by = 1) {
  if (typeof window === "undefined") return

  const today = todayKey()
  const raw = localStorage.getItem(KEY)

  let next: DailyProgress

  if (!raw) {
    next = { date: today, count: by }
  } else {
    try {
      const data: DailyProgress = JSON.parse(raw)
      next =
        data.date === today
          ? { date: today, count: data.count + by }
          : { date: today, count: by }
    } catch {
      next = { date: today, count: by }
    }
  }

  localStorage.setItem(KEY, JSON.stringify(next))
}
