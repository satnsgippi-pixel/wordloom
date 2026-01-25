"use client"

import { useEffect, useMemo, useState } from "react"
import { AudioButton } from "../audio-button"
import { MultipleChoice } from "../multiple-choice"
import type { WordData } from "../study-screen"
import { getWords } from "@/lib/words-store"

interface Stage2Props {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

/** util: shuffle */
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

/**
 * Stage2 (A案)
 * Audio (word/phrase) -> choose Japanese meaning (4 choices)
 * - Do NOT show the word text (audio only)
 * - Correct = wordData.meaning
 */
export function Stage2SentenceAudio({ wordData, onAnswer, disabled }: Stage2Props) {
  const [choices, setChoices] = useState<{ label: string; isCorrect: boolean }[]>([])

  const correctMeaning = useMemo(() => (wordData.meaning ?? "").trim(), [wordData.meaning])

  useEffect(() => {
    // 全単語から meaning プールを作る
    const pool = getWords()

    // meaningを集める（空・重複・正解と同一は除外）
    const uniq = new Set<string>()
    const wrongCandidates: string[] = []

    for (const w of pool) {
      const m = (w.meaning ?? "").trim()
      if (!m) continue
      if (m === correctMeaning) continue
      if (uniq.has(m)) continue
      uniq.add(m)
      wrongCandidates.push(m)
    }

    const wrongs = shuffle(wrongCandidates).slice(0, 3)

    // もし候補が足りないならダミー（最終保険）
    while (wrongs.length < 3) {
      wrongs.push("（別の意味）")
    }

    const opts = shuffle([
      { label: correctMeaning, isCorrect: true },
      ...wrongs.map((m) => ({ label: m, isCorrect: false })),
    ])

    setChoices(opts)
  }, [wordData.id, correctMeaning])

  // 正解側が空だと成立しないのでガード
  if (!correctMeaning) {
    return (
      <div>
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
          Audio → JA
        </p>
        <p className="text-sm text-zinc-600">meaning が未入力です（登録画面で入力してください）。</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        Audio → JA
      </p>

      {/* 音声のみ：単語/フレーズは表示しない */}
      <div className="p-4 bg-white rounded-lg border border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <AudioButton size="large" label="Play word" text={wordData.word} lang="en-US" />
          <div className="flex-1">
            <p className="text-sm text-[#6B7280]">Listen and choose the correct meaning.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">（英語の文字は表示しません）</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <MultipleChoice options={choices} onSelect={onAnswer} disabled={disabled} />
      </div>
    </div>
  )
}
