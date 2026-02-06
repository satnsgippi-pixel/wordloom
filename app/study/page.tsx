// app/study/page.tsx
import { Suspense } from "react";
import StudyClient from "./study-client";

export default function StudyPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Loading…</div>}>
        <StudyClient />
      </Suspense>
    </main>
  );
}
