"use client"

import { useMemo } from "react"
import { getWords } from "@/lib/words-store"
import type { WordData, SentenceData } from "@/lib/types"
import { ClozeMissingCard } from "./cloze-missing-card"

type Props = {
  wordData: WordData
  onAnswer: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
  mode?: "normal" | "weakness" | "quiz" | "challenge"
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function normalize(text: string): string {
  return (text ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+/g, "")
}

function requiredS5MinCount(entryType: WordData["entryType"]) {
  // 方針②：wordは1つ、phraseは2つ以上
  return entryType === "phrase" ? 2 : 1
}

function buildClozeLabel(sentence: SentenceData, idxs: number[]) {
  return idxs.map((i) => sentence.tokens[i]).filter(Boolean).join(" ")
}

export function Stage4ClozeChoice({ wordData, onAnswer, disabled }: Props) {
  const minCount = requiredS5MinCount(wordData.entryType)

  // ✅ s5が設定された例文だけから選ぶ
  const sentence: SentenceData | null = useMemo(() => {
    const list = (wordData.sentences ?? []).filter((s) => {
      const idxs = s?.s5?.targetTokenIndexes ?? []
      return s?.tokens?.length > 0 && idxs.length >= minCount
    })
    if (list.length === 0) return null
    return list[Math.floor(Math.random() * list.length)]
  }, [wordData.id, wordData.entryType])

  const targetIndexes = sentence?.s5?.targetTokenIndexes ?? []

  // 未設定
  if (!sentence || targetIndexes.length < minCount) {
    return (
      <ClozeMissingCard
        wordData={wordData}
        stageLabel="Stage4 (Choice)"
        helpText={
          wordData.entryType === "phrase"
            ? "編集画面で Stage5 の cloze を 2つ以上 設定してください（Stage4でも同じ設定を使います）。"
            : "編集画面で Stage5 の cloze を 1つ 設定してください（Stage4でも同じ設定を使います）。"
        }
      />
    )
  }

  const correct = buildClozeLabel(sentence, targetIndexes)

  const { displayTokens, choices } = useMemo(() => {
    const tokens = [...sentence.tokens]
    const blanks = new Set(targetIndexes)
    const display = tokens.map((t, i) => (blanks.has(i) ? "_____" : t))

    // ダミー生成：同じ entryType の単語/フレーズから、s5が有効なものを使う
    const pool = getWords().filter((w) => w.entryType === wordData.entryType && w.id !== wordData.id)

    const distractors: string[] = []
    for (const w of shuffle(pool)) {
      if (distractors.length >= 3) break
      const candidates = (w.sentences ?? []).filter((s) => {
        const idxs = s?.s5?.targetTokenIndexes ?? []
        return s?.tokens?.length > 0 && idxs.length >= minCount
      })
      if (candidates.length === 0) continue
      const s = candidates[Math.floor(Math.random() * candidates.length)]
      const idxs = s.s5!.targetTokenIndexes
      const label = buildClozeLabel(s, idxs)
      if (!label) continue
      if (normalize(label) === normalize(correct)) continue
      if (distractors.some((d) => normalize(d) === normalize(label))) continue
      distractors.push(label)
    }

    // どうしても足りない場合のフォールバック（保険）
    if (distractors.length < 3) {
      for (const w of shuffle(pool)) {
        if (distractors.length >= 3) break
        const label = w.word
        if (!label) continue
        if (normalize(label) === normalize(correct)) continue
        if (distractors.some((d) => normalize(d) === normalize(label))) continue
        distractors.push(label)
      }
    }

    const finalChoices = shuffle([correct, ...distractors].slice(0, 4))

    return { displayTokens: display, choices: finalChoices }
  }, [sentence, correct, targetIndexes.join(","), wordData.entryType, wordData.id, minCount])

  const handlePick = (picked: string) => {
    const isCorrect = normalize(picked) === normalize(correct)
    onAnswer(picked, isCorrect)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
        Cloze (Choice)
      </p>

      <div className="p-4 bg-white rounded-lg border border-[#E5E7EB]">
        <div className="text-base leading-relaxed flex flex-wrap gap-1">
          {displayTokens.map((t, i) => (
            <span
              key={i}
              className={t === "_____" ? "inline-block min-w-[80px] border-b-2 border-[#2563EB] text-center" : ""}
            >
              {t}
            </span>
          ))}
        </div>
        {sentence.ja && <p className="text-sm text-[#6B7280] leading-relaxed mt-2">{sentence.ja}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {choices.map((c) => (
          <button
            key={c}
            disabled={disabled}
            onClick={() => handlePick(c)}
            className="min-h-[44px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm hover:bg-[#EFF6FF] transition-colors disabled:opacity-60"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
