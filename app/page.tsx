export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Wordloom
        </h1>

        <p className="text-zinc-600">
          今日の学習を始めましょう。
        </p>

        <div className="space-y-3">
          <a
            href="/study"
            className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700"
          >
            Study
          </a>

          <a
            href="/words"
            className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-center font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Words
          </a>
        </div>
      </div>
    </main>
  );
}
