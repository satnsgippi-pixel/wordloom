"use client"

import { useEffect, useMemo, useState } from "react"

type Props = {
  wordId: string
  word: string
  meaning: string
  gptUrl: string
}

const QA_KEY = (wordId: string) => `wordloom.qaNote.v1.${wordId}`

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.left = "-9999px"
      ta.style.top = "-9999px"
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export function QAPanel({ wordId, word, meaning, gptUrl }: Props) {
  const [memo, setMemo] = useState("")
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyPayload = useMemo(() => {
    // ✅ 1回で貼り付けやすい最小形（ユーザー要望）
    return `Word: ${word}\nMeaning: ${meaning}\n`
  }, [word, meaning])

  useEffect(() => {
    // load
    try {
      const v = localStorage.getItem(QA_KEY(wordId))
      setMemo(v ?? "")
    } catch {
      setMemo("")
    }
    setSaved(false)
  }, [wordId])

  const onSave = () => {
    try {
      localStorage.setItem(QA_KEY(wordId), memo)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1200)
    } catch {
      // ignore
    }
  }

  const onCopy = async () => {
    const ok = await copyText(copyPayload)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 900)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#6B7280]">
        Q&A用AIに飛んで質問 → 回答をここに貼り付けて保存できます
      </p>

      {/* ✅ Copy prompt は廃止 → 単語+意味のワンタップコピー */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCopy}
          className="w-full py-3 text-sm font-medium text-[#111827] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFC] transition-colors min-h-[44px]"
        >
          {copied ? "Copied!" : "Copy word + meaning"}
        </button>

        <a
          href={gptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 text-sm font-medium text-[#111827] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFC] transition-colors min-h-[44px] flex items-center justify-center"
        >
          Open GPT
        </a>
      </div>

      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="AIの回答やメモをここに貼り付けて保存…"
        className="w-full h-40 p-3 text-sm text-[#111827] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:border-transparent placeholder:text-[#9CA3AF]"
      />

      <button
        onClick={onSave}
        className="w-full py-3 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
      >
        {saved ? "Saved!" : "Save"}
      </button>
    </div>
  )
}
