"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import type { WordData } from "@/lib/types"
import { loadWords } from "@/lib/storage"

function Card({
  title,
  value,
  sub,
}: {
  title: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
      <p className="text-xs text-[#6B7280]">{title}</p>
      <p className="text-2xl font-bold text-[#111827] mt-1">{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] mt-1">{sub}</p>}
    </div>
  )
}

export default function HomePage() {
  const [words, setWords] = useState<WordData[]>([])
  const [now, setNow] = useState<number>(Date.now())

  useEffect(() => {
    // 初回読み込み
    setWords(loadWords())

    // ざっくり更新（別タブ更新・due表示用）
    const onStorage = () => setWords(loadWords())
    window.addEventListener("storage", onStorage)

    const t = setInterval(() => setNow(Date.now()), 30_000)

    return () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(t)
    }
  }, [])

  const stats = useMemo(() => {
    const total = words.length
    const weak = words.filter((w) => !!w.weakness).length

    const due = words.filter((w) => (w.dueAt ?? 0) <= now).length
    const soon = words.filter((w) => {
      const dueAt = w.dueAt ?? 0
      return dueAt > now && dueAt <= now + 24 * 60 * 60 * 1000
    }).length

    const challengeReady = words.filter((w) => (w.stability ?? 0) >= 6).length

    return { total, weak, due, soon, challengeReady }
  }, [words, now])

  const suggestAdd = stats.total === 0 || stats.due + stats.soon < 10

  // 旧アプリのダッシュボードにあった「日替わりお題」枠（仮）
  const dailyPrompt = `Use "${words[0]?.word ?? "affect"}" in a sentence about your day.`

  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-20">
      <main className="px-4 pt-6 space-y-4 max-w-2xl mx-auto">
        {/* A) Overview（旧アプリ風） */}
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B7280]">Overview</p>
              <h1 className="text-xl font-bold text-[#111827] mt-1">Wordloom</h1>
            </div>

            <Link
              href="/words/new"
              className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium"
            >
              Add
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card title="Total" value={stats.total} />
            <Card title="Weakness" value={stats.weak} sub="弱点復習対象" />
            <Card title="Due now" value={stats.due} sub="今すぐ復習" />
            <Card title="Due soon" value={stats.soon} sub="24h以内" />
          </div>

          {suggestAdd && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900 font-medium">出題候補が少なめです</p>
              <p className="text-sm text-yellow-800 mt-1">
                新しい単語/フレーズを登録すると学習が回りやすくなります。
              </p>
              <div className="mt-3">
                <Link
                  href="/words/new"
                  className="inline-flex px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium"
                >
                  Add Word / Phrase
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* B) Today’s Study（旧アプリの雰囲気で） */}
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl">
          <p className="text-xs text-[#6B7280]">Today</p>
          <p className="text-lg font-semibold text-[#111827] mt-1">今日の学習を始めましょう。</p>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/study"
              className="w-full text-center py-3 rounded-lg bg-[#111827] text-white font-medium"
            >
              Start Normal Study
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/study/weakness"
                className="w-full text-center py-3 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] font-medium"
              >
                Weakness (10)
              </Link>
              <Link
                href="/study/challenge"
                className="w-full text-center py-3 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] font-medium"
              >
                Challenge (10)
              </Link>
            </div>
          </div>
        </div>

        {/* C) Shortcuts（旧アプリの枠っぽく） */}
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl">
          <p className="text-xs text-[#6B7280]">Shortcuts</p>

          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/words"
              className="px-4 py-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-sm font-medium"
            >
              Open Words
            </Link>

            <div className="ml-auto text-xs text-[#6B7280]">
              challenge-ready: {stats.challengeReady}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280] mb-1">Daily prompt</p>
            <p className="text-sm text-[#111827]">{dailyPrompt}</p>
          </div>
        </div>

        <div className="h-6" />
      </main>

      <BottomNav />
    </div>
  )
}
