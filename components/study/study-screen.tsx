"use client"

import { useEffect, useMemo, useState } from "react"
import { StudyHeader } from "./study-header"
import { QuestionCard } from "./question-card"
import { ResultCard } from "./result-card"

import { Stage0EnJa } from "./stages/stage-0-en-ja"
import { Stage1JaEn } from "./stages/stage-1-ja-en"
import { Stage2SentenceAudio } from "./stages/stage-2-sentence-audio"
import { Stage3JaEnType } from "./stages/stage-3-ja-en-type"
import { Stage4Definition } from "./stages/stage-4-definition"
import { Stage5ClozeSingle } from "./stages/stage-5-cloze-single"
import { Stage6ClozeMultiple } from "./stages/stage-6-cloze-multiple"
import { Stage7SelfJudge } from "./stages/stage-7-self-judge"

import { getWords, markWrong } from "@/lib/words-store"
import type { WordData } from "@/lib/types"

export type StudyMode = "normal" | "weakness" | "quiz" | "challenge"
export type { WordData }

// ✅ Stage2（音声）も含めて回す
// stage番号はそのまま使う（ResultCardやmarkWrongの記録にも効く）
const WORD_STAGES = [0, 1, 2, 3, 4, 5, 6, 7] as const
const PHRASE_STAGES = [0, 1, 2, 3, 4, 6, 7] as const // phraseはStage5をスキップ
type ActiveStage = (typeof WORD_STAGES)[number]

// util: shuffle
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function StudyScreen() {
  const [mode] = useState<StudyMode>("normal")

  // 出題キュー（単語の順番）
  const [queue, setQueue] = useState<WordData[]>([])
  const [qIndex, setQIndex] = useState(0)

  // ステージ
  const [stageIndex, setStageIndex] = useState(0)

  const [progress, setProgress] = useState({ current: 1, total: 20 })
  const [answer, setAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showResult, setShowResult] = useState(false)

  const currentWord: WordData | null = useMemo(() => {
    if (queue.length === 0) return null
    return queue[Math.min(qIndex, queue.length - 1)] ?? null
  }, [queue, qIndex])

  const stages = useMemo(() => {
    return currentWord?.entryType === "phrase" ? PHRASE_STAGES : WORD_STAGES
  }, [currentWord?.entryType])

  const currentStage: ActiveStage = stages[stageIndex] as ActiveStage

  useEffect(() => {
    const words = getWords()
    if (words.length === 0) {
      setQueue([])
      setQIndex(0)
      return
    }
    setQueue(shuffle(words))
    setQIndex(0)
    setStageIndex(0)
  }, [])

  // wordが変わったら stageIndex を0に戻す（entryTypeでlengthが変わると indexがはみ出すので）
  useEffect(() => {
    setStageIndex(0)
  }, [currentWord?.id])

  const handleAnswer = (selectedAnswer: string, correct: boolean) => {
    setAnswer(selectedAnswer)
    setIsCorrect(correct)
    setShowResult(true)

    if (!correct && currentWord) {
      markWrong(currentWord.word, currentStage)
    }
  }

  const handleNext = () => {
    setAnswer(null)
    setIsCorrect(null)
    setShowResult(false)

    // 次のステージへ
    const nextStageIndex = (stageIndex + 1) % stages.length
    setStageIndex(nextStageIndex)

    // ✅ ステージが一周したら次の単語へ
    if (nextStageIndex === 0) {
      setQIndex((prev) => prev + 1)
      setProgress((prev) => ({
        ...prev,
        current: Math.min(prev.current + 1, prev.total),
      }))
    }
  }

  const renderStage = () => {
    if (!currentWord) {
      return (
        <div className="text-sm text-zinc-600">
          単語がありません。先に登録してください。
        </div>
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
        return <Stage0EnJa {...commonProps} />
      case 1:
        return <Stage1JaEn {...commonProps} />
      case 2:
        return <Stage2SentenceAudio {...commonProps} />
      case 3:
        return <Stage3JaEnType {...commonProps} />
      case 4:
        return <Stage4Definition {...commonProps} />
      case 5:
        return <Stage5ClozeSingle {...commonProps} />
      case 6:
        return <Stage6ClozeMultiple {...commonProps} />
      case 7:
        return <Stage7SelfJudge {...commonProps} />
      default:
        return <Stage0EnJa {...commonProps} />
    }
  }

  const isLastQuestion = progress.current >= progress.total

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
            onNext={handleNext}
            isLastQuestion={isLastQuestion}
          />
        )}
      </main>
    </div>
  )
}
