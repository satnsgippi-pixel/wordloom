"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getWeakWordsCount,
  getDueNowCount,
  getOverdueCount,
  getLearnedL6PlusCount,
  getInProgressCount,
  getChallengeReadyCount,
} from "@/lib/words-store";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { MasteryChart } from "./mastery-chart";

const TARGET_TOTAL = 10_000;
const DAILY_TARGETS = [
  { value: 10, label: "10 Words (軽め)" },
  { value: 20, label: "20 Words (標準)" },
  { value: 30, label: "30 Words (少し頑張る)" },
  { value: 50, label: "50 Words (集中モード)" },
  { value: 100, label: "100 Words (限界突破)" },
] as const;

export function DashboardPage() {
  const [dailyTarget, setDailyTarget] = useState(30);

  const words = useLiveQuery(() => db.words.toArray());

  if (words === undefined) {
    return (
      <div className="min-h-dvh bg-[#fcfaf8] pb-20 flex items-center justify-center">
        <p className="text-sm font-medium animate-pulse text-slate-500">
          Loading your progress...
        </p>
      </div>
    );
  }

  const weakWords = getWeakWordsCount(words);
  const challengeReady = getChallengeReadyCount(words);
  const dueNow = getDueNowCount(words);
  const overdue = getOverdueCount(words);
  const learnedL6Plus = getLearnedL6PlusCount(words);
  const inProgress = getInProgressCount(words);
  const remaining = Math.max(0, TARGET_TOTAL - learnedL6Plus - inProgress);

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const studyHref = `/study?limit=${dailyTarget}`;

  return (
    <div className="min-h-dvh bg-[#fcfaf8] text-slate-800 pb-20">
      {/* Header */}
      <header className="max-w-3xl mx-auto mb-8 pt-6 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          word<span className="text-indigo-600">loom</span>
        </h1>
      </header>

      <main className="max-w-3xl mx-auto space-y-8 px-4">
        {/* Section 1: Study Plan Command Center */}
        <section aria-labelledby="study-plan-title">
          <div className="mb-4 px-2">
            <h2 id="study-plan-title" className="sr-only">
              学習計画の司令塔
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed text-center">
              迷わず学習を開始するための司令塔です。今日のコンディションに合わせて柔軟に目標を設定し、ワンタップで日々の学習をスタートさせましょう。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Today&apos;s Study Plan
              </h3>

              <label
                htmlFor="daily-target"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Daily Study Target:
              </label>
              <div className="relative">
                <select
                  id="daily-target"
                  value={dailyTarget}
                  onChange={(e) =>
                    setDailyTarget(Number(e.target.value) as 10 | 20 | 30 | 50 | 100)
                  }
                  className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium transition-colors cursor-pointer"
                >
                  {DAILY_TARGETS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <Link
                href={studyHref}
                className="block w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-5 px-6 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center justify-center gap-1 group"
              >
                <span className="text-lg tracking-wide">Launch Study</span>
                <span className="text-indigo-200 text-xs font-normal">
                  Today&apos;s Due: {fmt(dueNow)} | Overdue: {fmt(overdue)}
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {weakWords > 0 ? (
                <Link
                  href="/weakness"
                  className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 px-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  <span>🩹 Weakness Review</span>
                  <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">
                    {fmt(weakWords)}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 px-2 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed opacity-60 text-sm font-medium"
                >
                  <span>🩹 Weakness Review</span>
                  <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">
                    {fmt(weakWords)}
                  </span>
                </button>
              )}
              {challengeReady > 0 ? (
                <Link
                  href="/challenge"
                  className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 px-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  <span>⚔️ Bravery Mode</span>
                  <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">
                    {fmt(challengeReady)}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-3 px-2 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed opacity-60 text-sm font-medium"
                >
                  <span>⚔️ Bravery Mode</span>
                  <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">
                    {fmt(challengeReady)}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Mastery Roadmap */}
        <section aria-labelledby="roadmap-title">
          <div className="mb-4 px-2 mt-8">
            <h2 id="roadmap-title" className="sr-only">
              習得ロードマップ
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed text-center">
              最終目標である10,000語に対する現在の立ち位置を可視化します。実際に「習得（Mastered）」した単語が増えていく様子を視覚的に確認することで、長期的なモチベーションを維持します。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center md:text-left">
              Word Mastery: 10,000 Target
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <MasteryChart mastered={learnedL6Plus} inProgress={inProgress} />

              <div className="flex flex-col gap-5 w-full md:w-auto min-w-[200px]">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-indigo-700 shadow-sm flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                        🏆 Mastered
                      </p>
                      <p className="text-2xl font-bold text-slate-800">
                        {fmt(learnedL6Plus)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-300 shadow-sm flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                        🔄 In Progress
                      </p>
                      <p className="text-2xl font-bold text-slate-800">
                        {fmt(inProgress)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-slate-200 shadow-sm flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                        🎯 Remaining
                      </p>
                      <p className="text-2xl font-bold text-slate-800">
                        {fmt(remaining)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
