"use client";

import { DataTools } from "@/components/settings/data-tools";

export default function SettingsPage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] pb-20">
      <main className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold text-[#111827] mb-6">設定</h1>

        {/* データのエクスポート / インポート */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-3">
            データ
          </h2>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm">
            <DataTools />
          </div>
        </section>

        {/* APIキー・その他（サーバー側 .env の説明） */}
        <section>
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-3">
            APIキー
          </h2>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm">
            <p className="text-sm text-[#6B7280]">
              Gemini（AI）や TTS などはサーバー側の環境変数（.env.local の
              GEMINI_API_KEY、GOOGLE_TTS_API_KEY）で設定します。キーを変更した場合はサーバーを再起動してください。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
