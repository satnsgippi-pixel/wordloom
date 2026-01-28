// lib/ai-prompts.ts
import type { WordData } from "@/lib/types"

export const WORDLOOM_QA_GPT_URL = "https://chat.openai.com/g/REPLACE_WITH_YOUR_QA_GPT"
export const WORDLOOM_WRITING_GPT_URL =
  "https://chatgpt.com/g/g-69789f86375081918a625279885477a5-ying-zuo-wen-toreninku-koti"

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : ""
}

export function buildQaPrompt(word: WordData, userQuestion: string) {
  const examples = (word.sentences ?? []).slice(0, 2)
  const exLines =
    examples.length === 0
      ? "Examples:\n(none)"
      : `Examples:\n${examples
          .map((s, i) => `${i + 1}) ${safeStr(s.en)} / ${safeStr(s.ja)}`)
          .join("\n")}`

  return `[Wordloom Q&A]
Entry: ${safeStr(word.word)}
Type: ${safeStr(word.entryType)}
Meaning(JP): ${safeStr(word.meaning)}

${exLines}

My question:
${safeStr(userQuestion).trim() || "(no question)"}`
}

export function buildWritingPrompt(word: WordData, draft: string) {
  return `[Wordloom Writing]
Target: ${safeStr(word.word)} (${safeStr(word.entryType)})
Meaning(JP): ${safeStr(word.meaning)}

Task:
Write ONE natural sentence about my day using the target.
- If phrase, use the exact phrase (inflections OK if needed).
- Keep it natural, not textbook.

My draft:
${safeStr(draft).trim() || "(empty)"}

Return in this format:
1) Corrected
2) Why
3) Alternative
4) Vocabulary note
5) One drill`
}
