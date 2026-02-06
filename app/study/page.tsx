"use client";

import { useSearchParams } from "next/navigation";
import { StudyScreen } from "@/components/study/study-screen";

export default function StudyPage() {
  const searchParams = useSearchParams();
  const limitParam = searchParams.get("limit");
  const initialLimit =
    limitParam != null ? Math.min(100, Math.max(20, parseInt(limitParam, 10) || 20)) : undefined;

  return (
    <main className="min-h-screen bg-zinc-50">
      <StudyScreen initialLimit={initialLimit} />
    </main>
  );
}
