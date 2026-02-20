"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { EditWordLink } from "./edit-word-link"
import { Copy, ExternalLink } from "lucide-react"
import { AudioButton } from "@/components/study/audio-button"
import type { WordData } from "@/lib/types"
import { copyToClipboard } from "@/lib/clipboard"
import { setQaMemo } from "@/lib/words-store"

const WORD_QA_GPT_URL =
  "https://chatgpt.com/g/g-6978a7ff1f948191a23d1fe42441feee-ying-yu-huresushen-jue-ri-q-a"

const INITIAL_EXAMPLES = 2

export function WordDetailCard({ word }: { word: WordData }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_EXAMPLES)
  const [showMemo, setShowMemo] = useState(false)
  const [memo, setMemo] = useState("")
  const [saved, setSaved] = useState(false)

  const examples = word.sentences ?? []
  const visible = examples.slice(0, visibleCount)
  const hasMore = examples.length > visibleCount

  useEffect(() => {
    setMemo(word.qaMemo ?? "")
  }, [word.id, word.qaMemo])

  const copyPayload = useMemo(
    () => `Word: ${word.word}\nMeaning: ${word.meaning}\n`,
    [word.word, word.meaning]
  )

  const hasSavedMemo = Boolean((word.qaMemo ?? "").trim())

  const onCopy = async () => {
    await copyToClipboard(copyPayload)
  }

  const onSaveMemo = () => {
    setQaMemo(word.id, memo)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-5 shadow-sm">
      {/* Header: 単語（左） + コピー・OpenGPT（右） */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-[#111827]">Word</p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-semibold text-[#111827] truncate">
              {word.word}
            </span>
            <AudioButton
              size="small"
              label={`Play ${word.word}`}
              text={word.word}
              lang="en-US"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onCopy}
              className="p-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] transition-colors"
              title="Copy word + meaning"
              aria-label="Copy"
            >
              <Copy className="w-4 h-4 text-[#6B7280]" />
            </button>
            <a
              href={WORD_QA_GPT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] transition-colors"
              title="Open GPT"
              aria-label="Open GPT"
            >
              <ExternalLink className="w-4 h-4 text-[#6B7280]" />
            </a>
          </div>
        </div>

        <p className="mt-1 text-sm text-[#6B7280]">{word.meaning}</p>
      </div>

      {/* 例文のみ（タブなし） */}
      <div className="min-h-[80px]">
        <div className="space-y-3">
          {visible.map((s, idx) => (
            <div
              key={s.id ?? idx}
              className="p-3 rounded-lg bg-white border border-[#E5E7EB]"
            >
              <div className="flex items-start gap-3">
                <AudioButton
                  size="medium"
                  label={`Play sentence ${idx + 1}`}
                  text={s.en}
                  lang="en-US"
                />
                <div className="flex-1 pt-2">
                  <p className="text-sm text-[#111827] leading-relaxed">{s.en}</p>
                  <p className="text-xs text-[#6B7280] mt-1">{s.ja}</p>
                </div>
              </div>
            </div>
          ))}

          {examples.length === 0 && (
            <p className="text-sm text-[#6B7280]">No examples</p>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() =>
                setVisibleCount((v) => Math.min(v + 10, examples.length))
              }
              className="w-full py-3 text-base font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
            >
              +10 more
            </button>
          )}
        </div>

        {/* 深掘りメモ（アコーディオン） */}
        <div className="mt-3 border border-[#E5E7EB] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMemo((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[#111827] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors"
          >
            <span className="text-[#6B7280]">{showMemo ? "▼" : "▶︎"}</span>
            <span>深掘りメモ</span>
            {hasSavedMemo && (
              <span className="text-xs text-[#6B7280] font-normal">
                📝 保存済み
              </span>
            )}
          </button>
          {showMemo && (
            <div className="p-3 pt-0 bg-white border-t border-[#E5E7EB]">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="AIの回答やメモをここに…"
                rows={4}
                className="w-full p-3 text-sm text-[#111827] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#93C5FD] placeholder:text-[#9CA3AF]"
              />
              <button
                type="button"
                onClick={onSaveMemo}
                className="mt-2 w-full py-2.5 text-sm font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
              >
                {saved ? "Saved!" : "保存"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <EditWordLink wordId={word.id} />

        <Link
          href="/words"
          className="block text-sm text-[#6B7280] hover:text-[#2563EB] underline text-center transition-colors"
        >
          Back to Words
        </Link>
      </div>
    </div>
  )
}
