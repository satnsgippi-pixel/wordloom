import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContent,
      config: {
        systemInstruction,
        // responseMimeType is text/plain by default for standard generateContent, but we can omit or specify 'text/plain'
      },
    });

    if (!response.text) {
      throw new Error('Gemini API did not return text');
    }

    // JSONで包んでフロントエンドに返す
    return NextResponse.json({ detail: response.text });
  } catch (error) {
    console.error('Gemini API Detail Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate details' },
      { status: 500 }
    );
  }
}
