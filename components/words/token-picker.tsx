"use client"

import { useMemo } from "react"
import { tokenize } from "@/lib/tokenize"

type Props = {
  en: string
  s5Index: number | null
  s6Indices: number[]
  onChangeS5Index: (i: number | null) => void
  onChangeS6Indices: (arr: number[]) => void
}

/**
 * 記号は独立トークンとして表示するが、
 * 選択は「単語トークンのみ」に制限（安全策）。
 */
function isSelectableToken(t: string): boolean {
  // 英数字を1文字でも含むトークンのみ選択可
  return /[A-Za-z0-9]/.test(t)
}

export function TokenPicker({
  en,
  s5Index,
  s6Indices,
  onChangeS5Index,
  onChangeS6Indices,
}: Props) {
  const tokens = useMemo(() => tokenize(en), [en])

  const toggleS6 = (idx: number) => {
    if (s6Indices.includes(idx)) {
      onChangeS6Indices(s6Indices.filter((i) => i !== idx))
    } else {
      onChangeS6Indices([...s6Indices, idx].sort((a, b) => a - b))
    }
  }

  if (tokens.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Stage5 */}
      <div>
        <p className="text-sm font-semibold text-[#111827] mb-2">Stage5（1つ選択）</p>
        <div className="flex flex-wrap gap-2">
          {tokens.map((t, idx) => {
            const selectable = isSelectableToken(t)
            const active = s5Index === idx
            return (
              <button
                key={`s5-${idx}`}
                type="button"
                disabled={!selectable}
                onClick={() => onChangeS5Index(active ? null : idx)}
                className={[
                  "px-2 py-1 rounded border text-sm",
                  selectable
                    ? "bg-white border-[#E5E7EB] hover:bg-[#F8FAFC]"
                    : "bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed",
                  active ? "bg-[#EFF6FF] border-[#2563EB] text-[#111827] font-semibold" : "",
                ].join(" ")}
                aria-pressed={active}
                title={selectable ? "Select for Stage5" : "Punctuation cannot be selected"}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Stage6 */}
      <div>
        <p className="text-sm font-semibold text-[#111827] mb-2">Stage6（複数選択）</p>
        <div className="flex flex-wrap gap-2">
          {tokens.map((t, idx) => {
            const selectable = isSelectableToken(t)
            const active = s6Indices.includes(idx)
            return (
              <button
                key={`s6-${idx}`}
                type="button"
                disabled={!selectable}
                onClick={() => toggleS6(idx)}
                className={[
                  "px-2 py-1 rounded border text-sm",
                  selectable
                    ? "bg-white border-[#E5E7EB] hover:bg-[#F8FAFC]"
                    : "bg-[#F3F4F6] border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed",
                  active ? "bg-[#ECFDF5] border-[#10B981] text-[#111827] font-semibold" : "",
                ].join(" ")}
                aria-pressed={active}
                title={selectable ? "Toggle for Stage6" : "Punctuation cannot be selected"}
              >
                {t}
              </button>
            )
          })}
        </div>

        {s6Indices.length > 0 && (
          <p className="text-xs text-[#6B7280] mt-2">
            選択順は文中順（index順）で保存されます。
          </p>
        )}
      </div>
    </div>
  )
}
