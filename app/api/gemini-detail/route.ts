import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const maxDuration = 60; // Vercel timeout extension

export async function POST(request: Request) {
  try {
    const { word, meaning } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Valid word string is required' },
        { status: 400 }
      );
    }

    const systemInstruction = `
あなたは、難しい言葉を使わずに教えるのが得意な英語講師です。提供された英単語と意味について、以下のルールで解説を出力してください。

【ルール】
アスタリスク（*）やシャープ（#）などの記号は一切使わないでください。
強調したい部分は 【 】（すみ付き括弧）で囲んでください。（多用厳禁）
中学生でもわかるような、平易で日常的な日本語を使ってください。
前置きや挨拶は一切含めないでください。

【項目と書き方】
■語感のイメージ
（その単語が持つ「空気感」を、1〜2行で説明）

■いつ使うか
（フォーマルかカジュアルか。どんな場面で使うのが自然か）

■似た単語との違い
（「A（今回の単語）は〇〇だけど、B（似た単語）は××」という形式で、主語を明確にして1つだけ違いを提示）

■注意点
（間違えやすい使い方や、一緒に使ってはいけない言葉、勘違いしやすいポイントを1つ教えてください。）
`;

    const promptContent = meaning ? `英単語: ${word}\n意味: ${meaning}` : `英単語: ${word}`;

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: promptContent,
      config: {
        systemInstruction,
      },
    });

    // Create a readable stream for the frontend
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Gemini API Detail Error:', error);

    // 429 Quota Exceeded error handling
    const isQuotaError =
      error?.status === 429 ||
      (error?.message && error.message.toLowerCase().includes('quota'));
    const isNotFoundError = error?.status === 404 ||
      (error?.message && error.message.toLowerCase().includes('not found'));

    if (isQuotaError || isNotFoundError) {
      return new NextResponse(
        "現在AIが混み合っているか、無料利用枠（1日の上限）に達しました。\n明日またお試しいただくか、しばらく時間をおいてください。",
        {
          status: error?.status === 404 ? 404 : 429,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate details' },
      { status: 500 }
    );
  }
}
