"use client"

import { useMemo } from "react"
import { getWords } from "@/lib/words-store"
import type { WordData } from "@/lib/types"
import { ClozeMissingCard } from "./cloze-missing-card" // 既にある前提

type Props = {
  wordData: WordData
  onAnswer: (answer: string, correct: boolean) => void
  disabled?: boolean
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function Stage4ClozeChoice({ wordData, onAnswer, disabled }: Props) {
  const sentence = wordData.sentences?.[0]

  const { displaySentence, correctAnswer, choices } = useMemo(() => {
    if (!sentence) {
      return { displaySentence: null, correctAnswer: null, choices: [] }
    }

    const allWords = getWords()

    // -------------------------
    // ✅ WORD の場合
    // -------------------------
    if (wordData.entryType === "word") {
      const clozeIndex = wordData.cloze?.single

      if (clozeIndex == null) {
        return { displaySentence: null, correctAnswer: null, choices: [] }
      }

      const tokens = sentence.split(" ")
      const correct = tokens[clozeIndex]

      if (!correct) {
        return { displaySentence: null, correctAnswer: null, choices: [] }
      }

      tokens[clozeIndex] = "_____"

      const distractors = shuffle(
        allWords.filter(
          (w) =>
            w.entryType === "word" &&
            w.word !== correct
        )
      )
        .slice(0, 3)
        .map((w) => w.word)

      const finalChoices = shuffle([correct, ...distractors])

      return {
        displaySentence: tokens.join(" "),
        correctAnswer: correct,
        choices: finalChoices,
      }
    }

    // -------------------------
    // ✅ PHRASE の場合
    // -------------------------
    const phrase = wordData.word
    if (!phrase) {
      return { displaySentence: null, correctAnswer: null, choices: [] }
    }

    // 例文内に phrase があるか簡易チェック（大文字小文字無視）
    const regex = new RegExp(phrase, "i")
    if (!regex.test(sentence)) {
      return { displaySentence: null, correctAnswer: null, choices: [] }
    }

    const replaced = sentence.replace(regex, "_____")

    const distractors = shuffle(
      allWords.filter(
        (w) =>
          w.entryType === "phrase" &&
          w.word !== phrase
      )
    )
      .slice(0, 3)
      .map((w) => w.word)

    const finalChoices = shuffle([phrase, ...distractors])

    return {
      displaySentence: replaced,
      correctAnswer: phrase,
      choices: finalChoices,
    }
  }, [wordData, sentence])

  // 未設定 or 生成失敗
  if (!displaySentence || !correctAnswer || choices.length < 4) {
    return <ClozeMissingCard wordId={wordData.id} />
  }

  return (
    <div className="space-y-4">
      <p className="text-base text-[#111827]">{displaySentence}</p>

      <div className="grid grid-cols-2 gap-2">
        {choices.map((c) => (
          <button
            key={c}
            disabled={disabled}
            onClick={() => onAnswer(c, c === correctAnswer)}
            className="min-h-[44px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm hover:bg-[#EFF6FF] transition-colors disabled:opacity-60"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
