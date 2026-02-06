"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { StudyHeader } from "./study-header"
import { QuestionCard } from "./question-card"
import { ResultCard } from "./result-card"

import { Stage0EnJa } from "./stages/stage-0-en-ja"
import { Stage1JaEn } from "./stages/stage-1-ja-en"
import { Stage2SentenceAudio } from "./stages/stage-2-sentence-audio"
import { Stage3JaEnType } from "./stages/stage-3-ja-en-type"
import { Stage5ClozeSingle } from "./stages/stage-5-cloze-single"
import { Stage6ClozeMultiple } from "./stages/stage-6-cloze-multiple"
import { Stage7SelfJudge } from "./stages/stage-7-self-judge"

import {
  getWords,
  markWeaknessCorrect,
  markWeaknessWrong,
  markNormalCorrect,
  markNormalWrong,
} from "@/lib/words-store"
import type { WordData } from "@/lib/types"
import { incrementTodayProgress } from "@/lib/daily-progress"

export type StudyMode = "normal" | "weakness" | "quiz" | "challenge"

const WORD_STAGES = [0, 1, 2, 3, 5, 6, 7] as const
const PHRASE_STAGES = [0, 1, 2, 3, 6, 7] as const
type ActiveStage = (typeof WORD_STAGES)[number]

// util
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function getDueAtSafe(w: any): number {
  const v = w?.dueAt
  if (typeof v === "number" && Number.isFinite(v)) return v
  return 0
}

function clampStage(stage: number, list: readonly number[]) {
  const min = list[0]
  const max = list[list.length - 1]
  return Math.max(min, Math.min(max, stage))
}

const DEFAULT_LIMIT = 20

type Props = {
  mode?: StudyMode
  initialLimit?: number
}

export function StudyScreen({ mode = "normal", initialLimit }: Props) {
  const router = useRouter()
  const limit = initialLimit ?? DEFAULT_LIMIT

  const [queue, setQueue] = useState<WordData[]>([])
  const [qIndex, setQIndex] = useState(0)

  const [progress, setProgress] = useState({ current: 1, total: 20 })
  const [answer, setAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showResult, setShowResult] = useState(false)

  const currentWord: WordData | null = useMemo(() => {
    if (queue.length === 0) return null
    return queue[Math.min(qIndex, queue.length - 1)] ?? null
  }, [queue, qIndex])

  const currentStage: ActiveStage = useMemo(() => {
    if (!currentWord) return 0

    if (mode === "weakness" && currentWord.weakness) {
      return currentWord.weakness.stage as ActiveStage
    }

    const list = currentWord.entryType === "phrase" ? PHRASE_STAGES : WORD_STAGES
    return clampStage(currentWord.currentStage ?? 0, list) as ActiveStage
  }, [currentWord, mode])

  // ✅ 問題が切り替わるたびにUI状態をリセット
  useEffect(() => {
    setAnswer(null)
    setIsCorrect(null)
    setShowResult(false)
  }, [currentWord?.id, currentStage, mode])

  // ✅ キュー構築（mode依存）
  useEffect(() => {
    const words = getWords()
    const now = Date.now()

    if (words.length === 0) {
      setQueue([])
      setQIndex(0)
      setProgress({ current: 1, total: 0 })
      return
    }

    if (mode === "weakness") {
      const targets = words.filter((w) => !!w.weakness)
      const picked = shuffle(targets).slice(0, 10)

      setQueue(picked)
      setQIndex(0)
      setProgress({ current: 1, total: picked.length })
      return
    }

    if (mode === "challenge") {
      const now = Date.now()
    
      const targets = words.filter(
        (w) =>
          (w.stability ?? 0) >= 12 &&
          !w.weakness &&
          getDueAtSafe(w) > now
      )
    
      const picked = shuffle(targets).slice(0, 10)
    
      setQueue(picked)
      setQIndex(0)
      setProgress({ current: 1, total: picked.length })
      return
    }    
    
    // Normal: dueAt <= now のみ（最大 limit、Dashboard の +10 more で 30 など）
    const dueWords = words.filter((w) => getDueAtSafe(w) <= now)
    const first = shuffle(dueWords).slice(0, limit)

    setQueue(first)
    setQIndex(0)
    setProgress({ current: 1, total: first.length })
  }, [mode, limit])

  const handleAnswer = (_: string, correct: boolean) => {
    setIsCorrect(correct)
    setShowResult(true)
  
if (mode === "challenge") {
  // 何もしない（音・UIだけ）
  return
}

    // ✅ 今日の進捗 +1
    incrementTodayProgress(1)

    if (!currentWord) return

    if (mode === "weakness") {
      correct
        ? markWeaknessCorrect(currentWord.id)
        : markWeaknessWrong(currentWord.id, currentStage)
      return
    }

    correct
      ? markNormalCorrect(currentWord.id)
      : markNormalWrong(currentWord.id, currentStage)
  }

  const handleNext = () => {
    setQIndex((prev) => prev + 1)
    setProgress((p) => ({
      ...p,
      current: Math.min(p.current + 1, p.total),
    }))
  }

  const renderEmpty = (message: string, ctaHref: string, ctaLabel: string) => {
    return (
      <div className="space-y-3">
        <div className="text-sm text-zinc-600">{message}</div>
        <a
          href={ctaHref}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors min-h-[44px]"
        >
          {ctaLabel}
        </a>
      </div>
    )
  }

  const isLastQuestion = progress.total > 0 && progress.current >= progress.total

  const renderStage = () => {
    if (!currentWord) {
      if (mode === "weakness") {
        return renderEmpty(
          "弱点復習できる単語がありません。通常学習で間違えた単語がここに入ります。",
          "/study",
          "Go to Normal Study"
        )
      }

      return renderEmpty(
        "今日は学習できる単語が少なめです。新しい単語を登録しませんか？",
        "/words/new",
        "Add a Word"
      )
    }

    // Weaknessだがweaknessが消えた場合の保険（セッション中に解除された等）
    if (mode === "weakness" && !currentWord.weakness) {
      return renderEmpty(
        "この単語は弱点復習の対象ではなくなりました。次の問題へ進んでください。",
        "/",
        "Back to Home"
      )
    }

    const commonProps = {
      wordData: currentWord,
      onAnswer: handleAnswer,
      disabled: showResult,
      mode,
    }

    switch (currentStage) {
      case 0:
        return <Stage0EnJa key={`${currentWord.id}-${currentStage}`} {...commonProps} />
      case 1:
        return <Stage1JaEn key={`${currentWord.id}-${currentStage}`} {...commonProps} />
      case 2:
        return <Stage2SentenceAudio key={`${currentWord.id}-${currentStage}`} {...commonProps} />
      case 3:
        return <Stage3JaEnType key={`${currentWord.id}-${currentStage}`} {...commonProps} />
      case 5:
        return <Stage5ClozeSingle key={`${currentWord.id}-${currentStage}`} {...commonProps} />
      case 6:
        return <Stage6ClozeMultiple key={`${currentWord.id}-${currentStage}`} {...commonProps} />
      case 7:
        return <Stage7SelfJudge key={`${currentWord.id}-${currentStage}`} {...commonProps} />
      default:
        return <Stage0EnJa key={`${currentWord.id}-${currentStage}`} {...commonProps} />
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <StudyHeader progress={progress} mode={mode} />
      <main className="px-4 pb-20 pt-4 max-w-lg mx-auto">
        <QuestionCard>{renderStage()}</QuestionCard>

        {showResult && currentWord && (
          <ResultCard
            isCorrect={isCorrect!}
            correctAnswer={currentWord.word}
            wordData={currentWord}
            isLastQuestion={isLastQuestion}
            onNext={() => {
              if (isLastQuestion) {
                router.push("/")
              } else {
                handleNext()
              }
            }}
          />
        )}
      </main>
    </div>
  )
}
