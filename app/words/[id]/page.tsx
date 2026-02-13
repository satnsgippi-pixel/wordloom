"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadWords } from "@/lib/storage";
import { subscribeWords } from "@/lib/words-store";
import type { WordData } from "@/lib/types";
import { WordDetailCard } from "@/components/words/word-detail-card";

export default function WordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<WordData | null>(null);

  useEffect(() => {
    setWord(loadWords().find((w) => w.id === id) ?? null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const refresh = () => {
      setWord(loadWords().find((w) => w.id === id) ?? null);
    };
    const unsub = subscribeWords(refresh);
    return unsub;
  }, [id]);

  if (!word) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] p-6">
        <p className="text-sm text-[#6B7280]">Word not found.</p>
        <Link href="/words" className="underline text-[#2563EB] text-sm">
          Back to Words
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <WordDetailCard word={word} />
      </div>
    </main>
  );
}
