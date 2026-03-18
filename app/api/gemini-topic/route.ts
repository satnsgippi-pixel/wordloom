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
あなたは英語学習者をサポートするAI講師です。
ユーザーから提供された英単語と意味を使って、ユーザーが短い英語の例文（1〜2文程度）を自作するための「お題（シチュエーション）」を日本語で1つ提案してください。

必ず以下のJSONフォーマットのみを返し、その他の説明や挨拶は一切含めないでください。

{
  "topic": "お題のテキスト（例: あなたがレストランで注文を間違えられた時、店員に丁寧に作り直しを求めるシチュエーションで書いてみましょう。）"
}
`;

    const promptContent = meaning ? `英単語: ${word}\n意味: ${meaning}` : `英単語: ${word}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
  } catch (error: any) {
    console.error('Gemini API Topic Error:', error);

    const isQuotaError = error?.status === 429 || (error?.message && error.message.toLowerCase().includes('quota'));
    const isNotFoundError = error?.status === 404 || (error?.message && error.message.toLowerCase().includes('not found'));

    if (isQuotaError || isNotFoundError) {
      return NextResponse.json(
        { error: '現在AIが混み合っているか、利用制限に達しました。しばらく時間をおいてから再度お試しください。' },
        { status: error?.status === 404 ? 404 : 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate topic' },
      { status: 500 }
    );
  }
}
