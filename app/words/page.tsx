"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { WordData } from "@/lib/types";
import { loadWords } from "@/lib/storage";

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
      <p className="text-xs text-[#6B7280]">{title}</p>
      <p className="text-2xl font-bold text-[#111827] mt-1">{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [words, setWords] = useState<WordData[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // 初回読み込み
    setWords(loadWords());

    // "due soon" 表示のため、時刻だけ時々更新
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const total = words.length;

    const weak = words.filter((w) => !!w.weakness).length;

    // 仮ルール（後でSRS設計が固まったら調整）
    const due = words.filter((w) => (w.dueAt ?? 0) <= now).length;
    const soon = words.filter((w) => {
      const dueAt = w.dueAt ?? 0;
      return dueAt > now && dueAt <= now + 24 * 60 * 60 * 1000;
    }).length;

    // new（仮）：初期値のままのもの
    const newlyAdded = words.filter(
      (w) => (w.stability ?? 0) === 0 && (w.currentStage ?? 0) === 0
    ).length;

    // challenge候補（仮）：stability >= 6
    const challengeReady = words.filter((w) => (w.stability ?? 0) >= 6).length;

    return { total, weak, due, soon, newlyAdded, challengeReady };
  }, [words, now]);

  const suggestAdd =
    stats.total === 0 ||
    (stats.due + stats.soon < 10 && stats.newlyAdded < 10);

  return (
    <main className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Home</h1>
          <Link
            href="/words/new"
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium"
          >
            Add
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard title="Total" value={stats.total} />
          <StatCard title="Weakness" value={stats.weak} sub="弱点復習対象" />
          <StatCard title="Due now" value={stats.due} sub="今すぐ復習" />
          <StatCard title="Due soon" value={stats.soon} sub="24h以内" />
        </div>

        {/* Suggestions */}
        {suggestAdd && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900 font-medium">
              出題候補が少なめです
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              新しい単語/フレーズを登録すると学習が回りやすくなります。
            </p>
            <div className="mt-3">
              <Link
                href="/words/new"
                className="inline Fletcher px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium"
              >
                Add Word / Phrase
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
            <p className="text-lg font-semibold text-[#111827]">Study</p>
            <p className="text-sm text-[#6B7280] mt-1">
              Normal: 20問 + 10問ずつ追加 / Weakness・Challenge: 10問
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/study"
                className="w-full text-center py-3 rounded-lg bg-[#111827] text-white font-medium"
              >
                Start Normal Study
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/study/weakness"
                  className="w-full text-center py-3 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] font-medium"
                >
                  Weakness (10)
                </Link>
                <Link
                  href="/study/challenge"
                  className="w-full text-center py-3 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] font-medium"
                >
                  Challenge (10)
                </Link>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
            <p className="text-sm font-medium text-[#111827] mb-3">
              Library
            </p>
            <div className="flex gap-2">
              <Link
                href="/words"
                className="px-4 py-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-sm font-medium"
              >
                Open Words
              </Link>
              <div className="ml-auto text-xs text-[#6B7280] self-center">
                challenge-ready: {stats.challengeReady}
              </div>
            </div>
          </div>
        </div>

        {/* spacer */}
        <div className="h-6" />
      </div>
    </main>
  );
}
