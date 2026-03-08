import { useState, useMemo } from "react";
import type { WordData, SentenceData } from "@/lib/types";
import { tokenize } from "@/lib/tokenize";
import { buildClozePreview } from "@/lib/cloze";
import { upsertWord } from "@/lib/storage";

// Since we are running in the browser context (StudyScreen), we can rely on localStorage via upsertWord.
// The real types require unique IDs. Let's provide a fallback UID generator.
function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type Props = {
  wordData: WordData;
  onAnswer: (ans: string, isCorrect: boolean) => void;
  disabled?: boolean;
  mode?: string;
};

export function Stage8SelfWrite({ wordData, onAnswer, disabled, mode }: Props) {
  const [topic, setTopic] = useState<string>("");
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

  const [userSentence, setUserSentence] = useState("");
  const [isCorrecting, setIsCorrecting] = useState(false);

  const [correction, setCorrection] = useState<{
    correctedText: string;
    japaneseTranslation: string;
    feedback: string;
  } | null>(null);

  const [isSaved, setIsSaved] = useState(false);

  // ステート: Token選択モードか
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);
  const [s5Indices, setS5Indices] = useState<number[]>([]);
  const [s6Indices, setS6Indices] = useState<number[]>([]);

  // Tokenization用のロジック
  const s5Need = wordData.entryType === "phrase" ? 2 : 1;

  const stage5Preview = useMemo(() => {
    if (s5Indices.length < s5Need) return "";
    return buildClozePreview(tokens, s5Indices);
  }, [s5Need, s5Indices, tokens]);

  const stage6Preview = useMemo(() => {
    if (s6Indices.length === 0) return "";
    return buildClozePreview(tokens, s6Indices);
  }, [s6Indices, tokens]);

  const handleStartTokenize = () => {
    if (!correction) return;
    setTokens(tokenize(correction.correctedText));
    setIsTokenizing(true);
  };

  const toggleS5 = (index: number) => {
    setS5Indices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (wordData.entryType === "word") return [index];
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  const toggleS6 = (index: number) => {
    setS6Indices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  // ③ 確定して保存お題を取得
  const handleGenerateTopic = async () => {
    setIsGeneratingTopic(true);
    setTopic("");
    setCorrection(null);
    try {
      const res = await fetch("/api/gemini-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: wordData.word, meaning: wordData.meaning }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.topic) setTopic(data.topic);
    } catch (err) {
      console.error(err);
      alert("Failed to get topic.");
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // ② AI添削リクエスト
  const handleCorrect = async () => {
    if (!userSentence.trim()) return;
    setIsCorrecting(true);
    setCorrection(null);
    setIsSaved(false);
    try {
      const res = await fetch("/api/gemini-correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: wordData.word,
          topic,
          userSentence: userSentence.trim(),
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setCorrection({
        correctedText: data.correctedText || "",
        japaneseTranslation: data.japaneseTranslation || "",
        feedback: data.feedback || "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to correct sentence.");
    } finally {
      setIsCorrecting(false);
    }
  };

  // ③ 例文として登録
  const handleSaveAsExample = async () => {
    if (!correction) return;
    
    const newSentence: SentenceData = {
      id: uid(),
      en: correction.correctedText,
      ja: correction.japaneseTranslation,
      tokens,
      s5: s5Indices.length > 0 ? { targetTokenIndexes: s5Indices } : undefined,
      s6: s6Indices.length > 0 ? { blankTokenIndexes: s6Indices } : undefined,
    };

    const updatedWord: WordData = {
      ...wordData,
      sentences: [...(wordData.sentences || []), newSentence],
      updatedAt: Date.now(),
    };

    await upsertWord(updatedWord);
    setIsSaved(true);
  };

  const handleNext = () => {
    // Stage 8 は常に「正解」扱いとして次へ進むようにする
    onAnswer(userSentence || "Did not write", true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info */}
      <div className="text-center">
        <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
          STAGE 8: AI Essay
        </p>
        <h2 className="text-3xl font-bold text-[#111827] mb-1">{wordData.word}</h2>
        <p className="text-sm text-[#6B7280]">
          {wordData.meaning}
        </p>
      </div>

      {/* Step 1: Generate Topic */}
      {!topic && !isGeneratingTopic ? (
        <button
          onClick={handleGenerateTopic}
          disabled={disabled}
          className="w-full py-3 text-sm flex items-center justify-center font-medium text-[#2563EB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2"
        >
          ✨ お題を生成
        </button>
      ) : isGeneratingTopic ? (
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-center text-sm text-[#6B7280] animate-pulse">
          お題を生成中...
        </div>
      ) : (
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg">
          <p className="text-sm text-[#6B7280] font-medium mb-1">📋 お題</p>
          <p className="text-base text-[#111827]">{topic}</p>
        </div>
      )}

      {/* Step 2: User Input & Correction */}
      {topic && (
        <div className="space-y-3">
          <textarea
            value={userSentence}
            onChange={(e) => setUserSentence(e.target.value)}
            disabled={disabled || isCorrecting}
            placeholder="お題に沿って英文を入力してください..."
            rows={3}
            className="w-full p-4 bg-white border border-[#E5E7EB] rounded-lg text-base text-[#111827] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
          />
          <button
            onClick={handleCorrect}
            disabled={disabled || isCorrecting || !userSentence.trim()}
            className={`w-full py-3 text-base font-medium rounded-lg transition-colors flex items-center justify-center min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 ${
              !userSentence.trim() || isCorrecting || disabled
                ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            }`}
          >
            {isCorrecting ? "AIが添削しています..." : "✅ AIに添削してもらう"}
          </button>
        </div>
      )}

      {/* Step 3: Result & Save */}
      {correction && (
        <div className="mt-2 space-y-4">
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg space-y-4">
            <div>
              <p className="text-xs font-bold text-[#6B7280] uppercase mb-1">修正された英文</p>
              <p className="text-base text-[#111827]">{correction.correctedText}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6B7280] uppercase mb-1">日本語訳</p>
              <p className="text-sm text-[#4B5563]">{correction.japaneseTranslation}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6B7280] uppercase mb-1">フィードバック</p>
              <p className="text-sm text-[#4B5563]">{correction.feedback}</p>
            </div>
          </div>

          {!isTokenizing && !isSaved && (
            <button
              onClick={handleStartTokenize}
              className="w-full flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-colors bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
            >
              💾 この添削文を例文として登録する
            </button>
          )}

          {isTokenizing && !isSaved && (
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg space-y-4 mt-4">
              <h4 className="text-lg font-semibold text-[#111827]">
                穴埋め問題にしたい単語を選択
              </h4>

              <div>
                <p className="text-xs text-[#6B7280] mb-2">
                  Stage5（{wordData.entryType === "phrase" ? "2+ tokens" : "1 token"}）: ターゲットを選択
                </p>
                <div className="flex flex-wrap gap-2">
                  {tokens.map((t, i) => {
                    const isS5 = s5Indices.includes(i);
                    const order = isS5 ? s5Indices.indexOf(i) + 1 : null;
                    return (
                      <button
                        key={`s5-${t}-${i}`}
                        type="button"
                        onClick={() => toggleS5(i)}
                        className={`px-3 py-1 rounded-full border text-sm ${
                          isS5
                            ? "bg-blue-50 border-blue-300 text-blue-800"
                            : "bg-white border-[#E5E7EB] text-[#111827] hover:bg-gray-50"
                        }`}
                      >
                        {t}
                        {order !== null && (
                          <span className="ml-2 text-xs text-blue-700">{order}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-[#9CA3AF]">
                  {wordData.entryType === "phrase"
                    ? "Stage5は2つ以上選択してください"
                    : "Stage5は1つだけ選択できます"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#6B7280] mb-2 mt-4">
                  Stage6: トークンを選択（2つ以上推奨）
                </p>
                <div className="flex flex-wrap gap-2">
                  {tokens.map((t, i) => {
                    const isS6 = s6Indices.includes(i);
                    const order = isS6 ? s6Indices.indexOf(i) + 1 : null;
                    return (
                      <button
                        key={`s6-${t}-${i}`}
                        type="button"
                        onClick={() => toggleS6(i)}
                        className={`px-3 py-1 rounded-full border text-sm ${
                          isS6
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-white border-[#E5E7EB] text-[#111827] hover:bg-gray-50"
                        }`}
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

              {/* Previews */}
              {(s5Indices.length > 0 || s6Indices.length > 0) && (
                <div className="space-y-4 mt-4">
                  {s5Indices.length >= s5Need && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Stage5 Preview</p>
                      <p className="text-base text-[#111827]">{stage5Preview}</p>
                    </div>
                  )}
                  {s6Indices.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Stage6 Preview</p>
                      <p className="text-base text-[#111827]">{stage6Preview}</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSaveAsExample}
                disabled={(() => {
                  const s6ok = s6Indices.length >= 2;
                  const s5ok = s5Indices.length >= s5Need;
                  return !(s5ok && s6ok);
                })()}
                className={`w-full py-3 text-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] ${
                  (() => {
                    const s6ok = s6Indices.length >= 2;
                    const s5ok = s5Indices.length >= s5Need;
                    return (s5ok && s6ok);
                  })()
                    ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                    : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                ✅ 確定して保存
              </button>
            </div>
          )}

          {isSaved && (
            <button
              disabled
              className="w-full flex items-center justify-center py-2.5 text-sm font-medium rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] cursor-default transition-colors"
            >
              💾 登録完了！
            </button>
          )}
        </div>
      )}

      {/* Next Button wrapper since it uses its own state */}
      {correction && (
        <button
          onClick={handleNext}
          className="w-full mt-2 py-3 text-base flex justify-center items-center font-medium text-white bg-[#10B981] rounded-lg hover:bg-[#059669] transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:ring-offset-2"
        >
          Next
        </button>
      )}
    </div>
  );
}
