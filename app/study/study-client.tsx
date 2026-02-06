// app/study/study-client.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { StudyScreen } from "@/components/study/study-screen";

export default function StudyClient() {
  const searchParams = useSearchParams();
  const limitParam = searchParams.get("limit");

  const initialLimit =
    limitParam != null
      ? Math.min(100, Math.max(20, parseInt(limitParam, 10) || 20))
      : undefined;

  return <StudyScreen initialLimit={initialLimit} />;
}
