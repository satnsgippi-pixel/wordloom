import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const maxDuration = 60; // Vercel timeout extension

export async function POST(request: Request) {
  try {
    const { word, meaning, action = 'nuance', extraInput = '' } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Valid word string is required' },
        { status: 400 }
      );
    }

    const systemInstruction = `
あなたは、難しい言葉を使わずに教えるのが得意な英語講師です。提供されたプロンプトに対して、以下のルールで解説を出力してください。

【ルール】
- アスタリスク（*）やシャープ（#）などのMarkdown記号は一切使わないでください。
- 強調したい部分は 【 】（すみ付き括弧）で囲んでください。（多用厳禁）
- 見出しには ■ を使って、スマホで見やすい構造にしてください。
- 中学生でもわかるような、平易で日常的な日本語を使ってください。
- 丁寧語（です/ます調）で回答してください。
- 前置きや挨拶は一切含めず、すぐに本題に入ってください。
`;

    let promptContent = meaning ? `対象の英単語: ${word}\n意味: ${meaning}\n\n` : `対象の英単語: ${word}\n\n`;

    switch (action) {
      case 'compare':
        promptContent += `指示内容: 「${word}」と「${extraInput}」の違い、使い分けを教えてください。`;
        break;
      case 'etymology':
        promptContent += `指示内容: 「${word}」の語源や成り立ち、歴史を教えてください。`;
        break;
      case 'free':
        promptContent += `指示内容: ${extraInput}`;
        break;
      case 'nuance':
      default:
        promptContent += `指示内容: 「${word}」のコアイメージ（語感、ニュアンス、フォーマル度）を簡潔に教えてください。`;
        break;
    }

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
