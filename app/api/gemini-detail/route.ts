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
あなたは英語学習のサポートAIです。
ユーザーから提供された英単語が、指定された日本語の意味で使われる場合の深堀り情報を出力してください。
以下の3点のみを、簡潔なプレーンテキスト（またはマークダウン）で返してください。JSONである必要はありません。
その他の挨拶や余計な前置きなどは一切含めないでください。

① 語感・ニュアンス
② よく使われる場面（フォーマル / カジュアル 等）
③ 似た単語との使い分けや注意点
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
