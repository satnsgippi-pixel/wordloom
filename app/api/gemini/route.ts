import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// GoogleGenAIの初期化
// デフォルトでプロセス環境変数 GEMINI_API_KEY を自動的に読み込みます。
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
ユーザーから提供された英単語が、指定された日本語の意味で使われる場合の、自然な英語の例文を1つとその日本語訳を出力してください。指定された意味と異なる用法は避けてください。

必ず以下のJSONフォーマットのみを返し、その他の説明や挨拶は一切含めないでください。

{
  "example": "英語の例文",
  "translation": "日本語訳"
}
`;

    // ユーザーからのプロンプト（単語と意味を含める）
    const promptContent = meaning ? `英単語: ${word}\n意味: ${meaning}` : `英単語: ${word}`;

    // Gemini API を呼び出し
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: promptContent,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) {
      throw new Error('Gemini API did not return text');
    }

    const data = JSON.parse(response.text);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate example' },
      { status: 500 }
    );
  }
}
