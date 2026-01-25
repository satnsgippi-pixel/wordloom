"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { WordData } from "@/lib/types";
import { loadWords } from "@/lib/storage";

type SortOption = "newest" | "a-z" | "due-soon" | "stage-high";

export default function WordsPage() {
  const [words, setWords] = useState<WordData[]>([]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    setWords(loadWords());
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let result = words;
    if (s) {
      result = words.filter((w) => {
        const hay = `${w.word} ${w.meaning}`.toLowerCase();
        return hay.includes(s);
      });
    }

    // ソート適用
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        case "a-z":
          return a.word.localeCompare(b.word);
        case "due-soon": {
          const aDue = a.dueAt ?? Number.MAX_SAFE_INTEGER;
          const bDue = b.dueAt ?? Number.MAX_SAFE_INTEGER;
          if (aDue === Number.MAX_SAFE_INTEGER && bDue === Number.MAX_SAFE_INTEGER) return 0;
          if (aDue === Number.MAX_SAFE_INTEGER) return 1;
          if (bDue === Number.MAX_SAFE_INTEGER) return -1;
          return aDue - bDue;
        }
        case "stage-high":
          return (b.currentStage ?? 0) - (a.currentStage ?? 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [words, q, sortBy]);

  return (
    <main className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#111827]">Words</h1>
          <Link
            href="/words/new"
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium"
          >
            Add
          </Link>
        </div>

        <div className="mb-4 space-y-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search word / meaning..."
            className="w-full px-4 py-3 text-base text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:border-transparent"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-4 py-2 text-base text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:border-transparent"
          >
            <option value="newest">Newest</option>
            <option value="a-z">A→Z</option>
            <option value="due-soon">Due soon</option>
            <option value="stage-high">Stage (high→low)</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
            <p className="text-sm text-[#6B7280]">No words found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => (
              <div key={w.id} className="relative">
                {/* 行全体タップ → 詳細 */}
                <Link
                  href={`/words/${w.id}`}
                  className="block p-4 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[#111827]">
                        {w.word}
                      </p>
                      <p className="text-sm text-[#6B7280] mt-1">{w.meaning}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-xs text-[#9CA3AF]">
                      <span>stage: {w.currentStage ?? 0}</span>

                      {/* EditはLinkの中だと詳細リンクが優先されがちなので、クリックを止める */}
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/words/${w.id}/edit`;
                        }}
                        className="px-3 py-1 rounded-md border border-[#E5E7EB] text-[#2563EB] hover:bg-[#EFF6FF] cursor-pointer"
                      >
                        Edit
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="h-6" />
      </div>
    </main>
  );
}
