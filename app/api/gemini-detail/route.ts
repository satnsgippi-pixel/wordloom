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
あなたはプロの英語講師AIです。提供された英単語と意味に基づき、以下の3点を**「学習者が一瞬で要点を理解できる」**形式で出力してください。

【出力ルール】

各項目は必ず ###（Markdownの見出し）で始めてください。

重要なキーワードや、使い分けの核心となる部分は **太字** で強調してください。

箇条書き（- ）を多用し、1行を短くしてください。

余計な挨拶や前置き、結びの言葉は一切禁止します。

【項目】

① 語感・ニュアンス
（その単語が持つ独自の「温度感」や「イメージ」を説明）

② 使用シーン（フォーマル度）
（どのような場面で、誰に対して使うのが自然か）

③ 類義語との違い・注意点
（似た単語との決定的な違いを1つ提示）
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
