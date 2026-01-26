"use client"

import { useEffect, useState } from "react"
import { OverviewCard } from "@/components/dashboard/overview-card"
import { TodayStudyCard } from "@/components/dashboard/today-study-card"
import { ModeShortcuts } from "@/components/dashboard/mode-shortcuts"
import { BottomNav } from "./bottom-nav"
import {
  getWeakWordsCount,
  getTotalWordsCount,
  getDueNowCount,
  getOverdueCount,
  getNextNDaysCount,
  getLearnedL6PlusCount,
  getInProgressCount,
  subscribeWords,
  resetWordsStorage,
} from "@/lib/words-store"
import { getTodayProgress } from "@/lib/daily-progress"

// temporary (AI writing preview)
const dailyPrompt = "Use \"affect\" in a sentence about your day."
const dailyDraft = ""


export function DashboardPage() {
  const [weakWords, setWeakWords] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const isDev = process.env.NODE_ENV !== "production"
  const [dueNow, setDueNow] = useState(0)
  const [overdue, setOverdue] = useState(0)
  const [next3Days, setNext3Days] = useState(0)
  const [learnedL6Plus, setLearnedL6Plus] = useState(0)
  const [inProgress, setInProgress] = useState(0)
  const [todayProgress, setTodayProgress] = useState(0)
  const dailyGoal = 20

  useEffect(() => {
    const refresh = () => {
      setWeakWords(getWeakWordsCount())
      setTotalWords(getTotalWordsCount())
  
      setDueNow(getDueNowCount())
      setOverdue(getOverdueCount())
      setNext3Days(getNextNDaysCount(3))
  
      setLearnedL6Plus(getLearnedL6PlusCount())
      setInProgress(getInProgressCount())
      setTodayProgress(getTodayProgress())
    }
  
    // Initial load
    refresh()
  
    // Subscribe to changes
    const unsubscribe = subscribeWords(() => {
      refresh()
    })
  
    return unsubscribe
  }, [])  

  const handleResetLearningData = () => {
    if (!isDev) return

    const confirmed = window.confirm(
      "Are you sure you want to reset all learning data? This will clear all word progress and weaknesses stored in localStorage. This action cannot be undone."
    )

    if (confirmed) {
      try {
        resetWordsStorage()
        console.log("[dev] words storage reset")
        window.location.reload()
      } catch (error) {
        console.error("[dev] Failed to reset words storage:", error)
      }
    }
  }

  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-20">
      <main className="px-4 pt-6 space-y-4">
        {/* A) Overview Card */}
        <OverviewCard
          learnedL6Plus={learnedL6Plus}
          inProgress={inProgress}
          totalWords={totalWords}
       />

        {/* B) Today's Study Card */}
        <TodayStudyCard
          progress={todayProgress}
          goal={dailyGoal}
          dueNow={dueNow}
          overdue={overdue}
          next3Days={next3Days}
        />

        {/* C) Mode Shortcuts */}
        <ModeShortcuts
          weakWords={weakWords}
          dailyPrompt={dailyPrompt}
          dailyDraft={dailyDraft}
        />
      </main>

      {/* D) Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
