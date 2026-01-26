"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AudioButton } from "@/components/study/audio-button";
import type { WordData } from "@/lib/types";

function formatRelativeDue(dueAt: number | undefined) {
  if (!dueAt || !Number.isFinite(dueAt)) return { label: "N/A", detail: "" };

  const now = Date.now();
  const diffMs = dueAt - now;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin <= 0) {
    return { label: `DUE`, detail: `${Math.abs(diffMin)} min overdue` };
  }

  if (diffMin < 60) {
    return { label: `in ${diffMin} min`, detail: "" };
  }

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 48) {
    return { label: `in ${diffHr} h`, detail: "" };
  }

  const diffDay = Math.round(diffHr / 24);
  return { label: `in ${diffDay} d`, detail: "" };
}

function formatDateTime(ts: number | undefined) {
  if (!ts || !Number.isFinite(ts)) return "N/A";
  return new Date(ts).toLocaleString();
}

export function WordDetailCard({ word }: { word: WordData }) {
  const [tab, setTab] = useState<"examples" | "notes">("examples");

  const due = useMemo(() => formatRelativeDue(word.dueAt), [word.dueAt]);

  const currentStage = Number.isFinite(word.currentStage as number)
    ? (word.currentStage as number)
    : 0;

  const stageStreak = Number.isFinite(word.stageStreak as number)
    ? (word.stageStreak as number)
    : 0;

  const stability = Number.isFinite(word.stability as number)
    ? (word.stability as number)
    : 1;

  const dueAtText = useMemo(() => formatDateTime(word.dueAt), [word.dueAt]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-[#111827]">Word</p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-semibold text-[#111827]">
            {word.word}
          </span>
          <AudioButton
            size="small"
            label={`Play ${word.word}`}
            text={word.word}
            lang="en-US"
          />
        </div>

        <p className="mt-1 text-sm text-[#6B7280]">{word.meaning}</p>

        {word.definition && (
          <p className="mt-2 text-sm text-[#111827]">
            <span className="text-xs text-[#6B7280] mr-2">definition</span>
            {word.definition}
          </p>
        )}
      </div>

      {/* ✅ SRS Status (debug-friendly) */}
      <div className="mb-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#6B7280]">SRS</p>
            <p className="text-sm font-medium text-[#111827]">
              Due: <span className="font-semibold">{due.label}</span>
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              dueAt: {dueAtText}
              {due.detail ? ` (${due.detail})` : ""}
            </p>
          </div>

          {word.weakness ? (
            <span className="text-xs font-medium px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200">
              Weakness
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-1 rounded bg-zinc-50 text-zinc-700 border border-zinc-200">
              Normal
            </span>
          )}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-white border border-[#E5E7EB] px-2 py-1">
            <p className="text-[11px] text-[#6B7280]">stage</p>
            <p className="text-sm font-medium text-[#111827]">{currentStage}</p>
          </div>
          <div className="rounded-md bg-white border border-[#E5E7EB] px-2 py-1">
            <p className="text-[11px] text-[#6B7280]">streak</p>
            <p className="text-sm font-medium text-[#111827]">{stageStreak}</p>
          </div>
          <div className="rounded-md bg-white border border-[#E5E7EB] px-2 py-1">
            <p className="text-[11px] text-[#6B7280]">stability</p>
            <p className="text-sm font-medium text-[#111827]">
              {stability.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] mb-4">
        <div className="flex gap-6">
          {(["examples", "notes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[160px]">
        {tab === "examples" && (
          <div className="space-y-3">
            {(word.sentences ?? []).map((s, idx) => (
              <div
                key={s.id ?? idx}
                className="p-3 rounded-lg bg-white border border-[#E5E7EB]"
              >
                <div className="flex items-start gap-3">
                  <AudioButton
                    size="medium"
                    label={`Play sentence ${idx + 1}`}
                    text={s.en}
                    lang="en-US"
                  />
                  <div className="flex-1 pt-2">
                    <p className="text-sm text-[#111827] leading-relaxed">
                      {s.en}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">{s.ja}</p>
                  </div>
                </div>
              </div>
            ))}

            {(word.sentences ?? []).length === 0 && (
              <p className="text-sm text-[#6B7280]">No examples</p>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="text-sm text-[#6B7280]">
            （メモは後で実装）{/* いまは空でOK */}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <Link
          href={`/words/${word.id}/edit`}
          className="block w-full text-center py-3 text-base font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors min-h-[48px]"
        >
          Edit
        </Link>

        <Link
          href="/words"
          className="block text-sm text-[#6B7280] hover:text-[#2563EB] underline text-center transition-colors"
        >
          Back to Words
        </Link>
      </div>
    </div>
  );
}
