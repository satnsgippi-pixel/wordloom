import type { StudyMode } from "./study-screen"

interface StudyHeaderProps {
  progress: { current: number; total: number }
  mode: StudyMode
}

export function StudyHeader({ progress, mode }: StudyHeaderProps) {
  const showChip = mode === "weakness" || mode === "quiz" || mode === "challenge"
  const chipLabel =
    mode === "weakness" ? "Weakness" : mode === "quiz" ? "Quiz" : mode === "challenge" ? "腕試し" : ""

  return (
    <header className="px-4 pt-6 pb-4 bg-[#F8FAFC]">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#111827]">Study</h1>
          {showChip && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#EFF6FF] text-[#1D4ED8]">{chipLabel}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">
          Today: {progress.current} / {progress.total}
        </p>
      </div>
    </header>
  )
}
