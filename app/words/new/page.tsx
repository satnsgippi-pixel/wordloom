"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EntryType, WordData } from "@/lib/types";
import { upsertWord } from "@/lib/storage";
import { tokenize } from "@/lib/tokenize";
import { buildClozePreview } from "@/lib/cloze";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type SentenceDraft = {
  id: string;
  en: string;
  ja: string;
  tokens: string[];
  s5Index: number | null;
  s6Indices: number[];
  hasEditedEn: boolean;
  hadClozeBeforeEdit: boolean;
};

export default function NewWordPage() {
  const router = useRouter();

  const [entryType, setEntryType] = useState<EntryType>("word");
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");

  const [sentencesDraft, setSentencesDraft] = useState<SentenceDraft[]>([
    {
      id: uid(),
      en: "",
      ja: "",
      tokens: [],
      s5Index: null,
      s6Indices: [],
      hasEditedEn: false,
      hadClozeBeforeEdit: false,
    },
  ]);

  // 例文ブロック追加
  const addSentence = () => {
    setSentencesDraft((prev) => [
      ...prev,
      {
        id: uid(),
        en: "",
        ja: "",
        tokens: [],
        s5Index: null,
        s6Indices: [],
        hasEditedEn: false,
        hadClozeBeforeEdit: false,
      },
    ]);
  };

  // 例文ブロック削除
  const removeSentence = (id: string) => {
    if (sentencesDraft.length <= 1) return;
    setSentencesDraft((prev) => prev.filter((s) => s.id !== id));
  };

  // 例文の英文更新
  const updateSentenceEn = (id: string, value: string) => {
    setSentencesDraft((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const tokens = tokenize(value);
        const hadCloze = s.hasEditedEn && (s.s5Index !== null || s.s6Indices.length > 0);
        return {
          ...s,
          en: value,
          tokens,
          hasEditedEn: true,
          hadClozeBeforeEdit: hadCloze,
          s5Index: hadCloze ? null : s.s5Index,
          s6Indices: hadCloze ? [] : s.s6Indices,
        };
      })
    );
  };

  // 例文の日本語更新
  const updateSentenceJa = (id: string, value: string) => {
    setSentencesDraft((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ja: value } : s))
    );
  };

  // Stage5トグル
  const toggleS5 = (sentenceId: string, tokenIndex: number) => {
    setSentencesDraft((prev) =>
      prev.map((s) => {
        if (s.id !== sentenceId) return s;
        return {
          ...s,
          s5Index: s.s5Index === tokenIndex ? null : tokenIndex,
        };
      })
    );
  };

  // Stage6トグル
  const toggleS6 = (sentenceId: string, tokenIndex: number) => {
    setSentencesDraft((prev) =>
      prev.map((s) => {
        if (s.id !== sentenceId) return s;
        const current = s.s6Indices;
        if (current.includes(tokenIndex)) {
          return { ...s, s6Indices: current.filter((x) => x !== tokenIndex) };
        }
        if (entryType === "word" && current.length >= 3) {
          return s;
        }
        return {
          ...s,
          s6Indices: [...current, tokenIndex].sort((a, b) => a - b),
        };
      })
    );
  };

  // Entry type変更時に全例文のclozeをリセット
  const handleEntryTypeChange = (newType: EntryType) => {
    setEntryType(newType);
    setSentencesDraft((prev) =>
      prev.map((s) => ({
        ...s,
        s5Index: null,
        s6Indices: [],
        hadClozeBeforeEdit: false,
      }))
    );
  };

  // バリデーション
  const baseOk =
    word.trim().length > 0 &&
    meaning.trim().length > 0;

  const allSentencesOk = sentencesDraft.every(
    (s) =>
      s.en.trim().length > 0 &&
      s.ja.trim().length > 0 &&
      s.tokens.length > 0
  );

  const allClozeOk = sentencesDraft.every((s) => {
    if (entryType === "word") {
      return s.s5Index !== null && s.s6Indices.length === 3;
    } else {
      return s.s6Indices.length >= 2;
    }
  });

  const canSave = baseOk && allSentencesOk && allClozeOk;

  // 保存処理
  const handleSave = () => {
    if (!canSave) return;

    const now = Date.now();

    const newWord: WordData = {
      id: uid(),
      entryType,
      word: word.trim(),
      meaning: meaning.trim(),
      sentences: sentencesDraft.map((s) => ({
        id: s.id,
        en: s.en.trim(),
        ja: s.ja.trim(),
        tokens: s.tokens,
        s5:
          entryType === "word" && s.s5Index !== null
            ? { targetTokenIndexes: [s.s5Index] }
            : undefined,
        s6:
          s.s6Indices.length > 0
            ? { blankTokenIndexes: s.s6Indices }
            : undefined,
      })),
      currentStage: 0,
      stageStreak: 0,
      stability: 1,
      dueAt: now,
      weakness: undefined,
      createdAt: now,
      updatedAt: now,
    };

    upsertWord(newWord);
    router.push("/words");
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Add</h1>
          <button
            onClick={() => router.push("/words")}
            className="text-sm text-[#2563EB] hover:underline"
          >
            Cancel
          </button>
        </div>

        {/* Entry type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#6B7280] mb-2">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleEntryTypeChange("word")}
              className={`px-4 py-2 rounded-lg border text-sm ${
                entryType === "word"
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-white text-[#111827] border-[#E5E7EB]"
              }`}
            >
              word
            </button>
            <button
              type="button"
              onClick={() => handleEntryTypeChange("phrase")}
              className={`px-4 py-2 rounded-lg border text-sm ${
                entryType === "phrase"
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-white text-[#111827] border-[#E5E7EB]"
              }`}
            >
              phrase
            </button>
          </div>
          <p className="mt-2 text-xs text-[#9CA3AF]">
            word: Stage5(1 token) + Stage6(3 tokens) / phrase: Stage6(2+ tokens)
          </p>
        </div>

        {/* Word / Meaning */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Word / Phrase
            </label>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder='例: affect / look forward to'
              className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">
              Meaning
            </label>
            <input
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="例: 影響する"
              className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
            />
          </div>
        </div>

        {/* Sentences */}
        <div className="space-y-6 mb-4">
          {sentencesDraft.map((sentence, index) => (
            <SentenceBlock
              key={sentence.id}
              sentence={sentence}
              entryType={entryType}
              index={index}
              canRemove={sentencesDraft.length > 1}
              onEnChange={(value) => updateSentenceEn(sentence.id, value)}
              onJaChange={(value) => updateSentenceJa(sentence.id, value)}
              onToggleS5={(tokenIndex) => toggleS5(sentence.id, tokenIndex)}
              onToggleS6={(tokenIndex) => toggleS6(sentence.id, tokenIndex)}
              onRemove={() => removeSentence(sentence.id)}
            />
          ))}
        </div>

        {/* Add sentence button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={addSentence}
            className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-[#111827] text-sm font-medium hover:bg-[#F9FAFB]"
          >
            + Add sentence
          </button>
        </div>

        {/* Save */}
        <div className="sticky bottom-0 bg-[#F9FAFB] pt-4 pb-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-3 text-base font-medium rounded-lg transition-colors ${
              canSave
                ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
            } focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2`}
          >
            Save
          </button>
        </div>
      </div>
    </main>
  );
}

type SentenceBlockProps = {
  sentence: SentenceDraft;
  entryType: EntryType;
  index: number;
  canRemove: boolean;
  onEnChange: (value: string) => void;
  onJaChange: (value: string) => void;
  onToggleS5: (tokenIndex: number) => void;
  onToggleS6: (tokenIndex: number) => void;
  onRemove: () => void;
};

function SentenceBlock({
  sentence,
  entryType,
  index,
  canRemove,
  onEnChange,
  onJaChange,
  onToggleS5,
  onToggleS6,
  onRemove,
}: SentenceBlockProps) {
  const stage5Preview = useMemo(() => {
    if (entryType !== "word") return "";
    if (sentence.s5Index === null) return "";
    return buildClozePreview(sentence.tokens, [sentence.s5Index]);
  }, [entryType, sentence.s5Index, sentence.tokens]);

  const stage6Preview = useMemo(() => {
    if (sentence.s6Indices.length === 0) return "";
    return buildClozePreview(sentence.tokens, sentence.s6Indices);
  }, [sentence.s6Indices, sentence.tokens]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#111827]">
          Sentence {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-[#DC2626] hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      {/* English / Japanese */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-2">
            English sentence
          </label>
          <textarea
            value={sentence.en}
            onChange={(e) => onEnChange(e.target.value)}
            placeholder="例: I look really forward to it."
            rows={3}
            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-2">
            Japanese
          </label>
          <textarea
            value={sentence.ja}
            onChange={(e) => onJaChange(e.target.value)}
            placeholder="例: それを本当に楽しみにしている。"
            rows={3}
            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C5FD] resize-none"
          />
        </div>
      </div>

      {/* Warning */}
      {sentence.hadClozeBeforeEdit && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            英文を編集したので穴埋めを再設定してください
          </p>
        </div>
      )}

      {/* Token chips */}
      {sentence.tokens.length > 0 && (
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
          <h4 className="text-lg font-semibold text-[#111827] mb-2">
            Cloze selection
          </h4>

          {entryType === "word" && (
            <div>
              <p className="text-xs text-[#6B7280] mb-2">
                Stage5（1 token）: 下のボタンでターゲットを1つ選択
              </p>
              <div className="flex flex-wrap gap-2">
                {sentence.tokens.map((t, i) => {
                  const isS5 = sentence.s5Index === i;
                  return (
                    <button
                      key={`s5-${t}-${i}`}
                      type="button"
                      onClick={() => onToggleS5(i)}
                      className={`px-3 py-1 rounded-full border text-sm ${
                        isS5
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-white border-[#E5E7EB] text-[#111827]"
                      }`}
                      title="Tap to set Stage5 target"
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p
            className={`text-xs text-[#6B7280] mb-4 ${
              entryType === "word" ? "mt-4" : ""
            }`}
          >
            Stage6: tokensを選択（wordは3つ、phraseは2つ以上）
          </p>

          <div className="flex flex-wrap gap-2">
            {sentence.tokens.map((t, i) => {
              const isS6 = sentence.s6Indices.includes(i);
              const order = isS6 ? sentence.s6Indices.indexOf(i) + 1 : null;

              return (
                <button
                  key={`${t}-${i}`}
                  type="button"
                  onClick={() => onToggleS6(i)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    isS6
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-white border-[#E5E7EB] text-[#111827]"
                  }`}
                  title="Tap to toggle Stage6"
                >
                  {t}
                  {order !== null && (
                    <span className="ml-2 text-xs text-green-700">{order}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview */}
      {sentence.tokens.length > 0 &&
        (sentence.s5Index !== null || sentence.s6Indices.length > 0) && (
          <div className="space-y-4">
            {entryType === "word" && sentence.s5Index !== null && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Stage5 Preview
                </p>
                <p className="text-base text-[#111827]">{stage5Preview}</p>
              </div>
            )}

            {sentence.s6Indices.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Stage6 Preview
                </p>
                <p className="text-base text-[#111827]">{stage6Preview}</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
