"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { EditWordLink } from "./edit-word-link"
import { AudioButton } from "@/components/study/audio-button"
import type { WordData } from "@/lib/types"
import { setQaMemo } from "@/lib/words-store"

export function WordDetailCard({ word }: { word: WordData }) {
  const [showMemo, setShowMemo] = useState(false)
  const [memo, setMemo] = useState("")
  const [saved, setSaved] = useState(false)

  const examples = word.sentences ?? []

  useEffect(() => {
    setMemo(word.qaMemo ?? "")
  }, [word.id, word.qaMemo])

  const hasSavedMemo = Boolean((word.qaMemo ?? "").trim())

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
        </div>

        <p className="mt-1 text-sm text-[#6B7280]">{word.meaning}</p>
      </div>

      {/* 例文のみ（タブなし） */}
      <div className="min-h-[80px]">
        <div className="space-y-3">
          {examples.map((s, idx) => (
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
            <div className="p-3 pt-0 bg-white border-t border-[#E5E7EB] min-h-[320px] flex flex-col">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="AIの回答やメモをここに…"
                rows={10}
                className="w-full flex-1 min-h-[260px] p-3 text-sm text-[#111827] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#93C5FD] placeholder:text-[#9CA3AF] mt-3"
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
