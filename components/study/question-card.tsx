import type React from "react"
interface QuestionCardProps {
  children: React.ReactNode
}

export function QuestionCard({ children }: QuestionCardProps) {
  return <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-5 shadow-sm">{children}</div>
}
