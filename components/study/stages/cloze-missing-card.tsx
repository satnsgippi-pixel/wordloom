"use client"

import Link from "next/link"
import type { WordData } from "@/lib/types"

type Props = {
  wordData: WordData
  stageLabel?: string // 例: "Stage4" / "Stage5"
  helpText?: string
}

export function ClozeMissingCard({ wordData, stageLabel = "Cloze", helpText }: Props) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        {stageLabel}
      </p>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">Cloze が未設定です</p>

        <p className="text-sm text-[#111827] font-semibold">{wordData.word}</p>
        {wordData.meaning && (
          <p className="text-xs text-[#6B7280] mt-1">{wordData.meaning}</p>
        )}

        <p className="text-xs text-yellow-700 mt-2">
          {helpText ?? "編集画面で cloze を設定してください。"}
        </p>

        <div className="mt-3">
          <Link
            href={`/words/${wordData.id}/edit?from=study`}
            className="h-9 px-3 inline-flex items-center justify-center rounded-lg bg-white border border-yellow-200 text-sm font-medium text-yellow-900 hover:bg-yellow-100 transition-colors"
          >
            この単語を編集する
          </Link>
        </div>
      </div>
    </div>
  )
}
