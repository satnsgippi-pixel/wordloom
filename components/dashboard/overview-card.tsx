interface OverviewCardProps {
  learnedL6Plus: number
  inProgress: number
  totalWords: number
}

export function OverviewCard({ learnedL6Plus, inProgress, totalWords }: OverviewCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-[#6B7280] text-xs mb-1">覚えた</p>
          <p className="text-[#111827] text-xl font-semibold">{learnedL6Plus}</p>
        </div>
        <div className="text-center border-x border-[#E5E7EB]">
          <p className="text-[#6B7280] text-xs mb-1">学習中</p>
          <p className="text-[#111827] text-xl font-semibold">{inProgress}</p>
        </div>
        <div className="text-center">
          <p className="text-[#6B7280] text-xs mb-1">合計</p>
          <p className="text-[#111827] text-xl font-semibold">{totalWords}</p>
        </div>
      </div>
    </div>
  )
}
