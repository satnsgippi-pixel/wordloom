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
  getChallengeReadyCount,
} from "@/lib/words-store"
import { DataTools } from "@/components/settings/data-tools"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"

export function DashboardPage() {
  const words = useLiveQuery(() => db.words.toArray());
  const todayProgress = useLiveQuery(() => db.dailyProgress.get(new Date().toISOString().slice(0, 10)).then(r => r?.count || 0));
  
  const dailyGoal = 20

  if (words === undefined || todayProgress === undefined) {
    return (
      <div className="min-h-dvh bg-[#F8FAFC] pb-20 flex items-center justify-center">
        <p className="text-sm font-medium animate-pulse text-zinc-500">Loading your progress...</p>
      </div>
    );
  }

  const weakWords = getWeakWordsCount(words);
  const totalWords = getTotalWordsCount(words);
  const challengeReady = getChallengeReadyCount(words);
  const dueNow = getDueNowCount(words);
  const overdue = getOverdueCount(words);
  const next3Days = getNextNDaysCount(words, 3);
  const learnedL6Plus = getLearnedL6PlusCount(words);
  const inProgress = getInProgressCount(words);

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
          challengeEnabled={challengeReady > 0}
        
        />

        {/* Data Export / Import */}
        <div className="pt-6 border-t border-[#E5E7EB]">
          <DataTools />
        </div>

      </main>

      {/* D) Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
