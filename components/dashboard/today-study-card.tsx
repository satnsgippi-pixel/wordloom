"use client"

import Link from "next/link"

interface TodayStudyCardProps {
  progress: number
  goal: number
  dueNow: number
  overdue: number
  next3Days: number
}

export function TodayStudyCard({ progress, goal, dueNow, overdue, next3Days }: TodayStudyCardProps) {
  const barMax = 20
  const barValue = Math.min(progress, barMax)
  const isComplete = progress >= barMax

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#111827] font-semibold">Today&apos;s study</h2>
        <span className="text-[#2563EB] font-semibold text-lg">
          {progress} / {barMax}
        </span>
      </div>

      {/* Status row (fixed height) */}
      <div className="min-h-[20px] mb-4">
        {isComplete && (
          <span className="text-sm text-[#6B7280]">complete</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#EFF6FF] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
          style={{ width: `${(barValue / barMax) * 100}%` }}
        />
      </div>

      {/* Workload stats row */}
      <div className="flex items-center justify-center gap-4 text-sm text-[#6B7280] mb-4">
        <span>Due <span className="text-[#111827] font-medium">{dueNow}</span></span>
        <span className="text-[#E5E7EB]">•</span>
        <span>Overdue <span className="text-[#111827] font-medium">{overdue}</span></span>
        <span className="text-[#E5E7EB]">•</span>
        <span>Next <span className="text-[#111827] font-medium">{next3Days}</span></span>
      </div>

      {/* CTA Button */}
      <Link
        href="/study"
        className="block w-full h-11 bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-medium rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
      >
        {isComplete ? "+10" : "Continue Study"}
      </Link>

      {/* +10 more: 問題が残っているときだけ表示 */}
      {dueNow + overdue > 20 && (
        <Link
          href="/study?limit=30"
          className="mt-3 block w-full h-11 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-medium rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
        >
          +10 more
        </Link>
      )}
    </div>
  )
}
