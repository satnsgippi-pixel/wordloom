import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { word, topic, userSentence } = await request.json();

    if (!word || !userSentence || typeof userSentence !== 'string') {
      return NextResponse.json(
        { error: 'Valid word and userSentence strings are required' },
        { status: 400 }
      );
    }

    const systemInstruction = `
あなたは英語学習者をサポートするプロのネイティブ英語講師です。
ユーザーが指定の英単語とお題に沿って書いた英文を添削してください。

以下の3点を含んだJSONフォーマットのみを返してください。その他の説明や挨拶は一切含めないでください。

1. "correctedText": ユーザーの英文を、文法的に正しく、より自然なネイティブらしい英語に修正した文（1〜2文程度）。元の意図をできるだけ汲み取ってください。
2. "japaneseTranslation": 修正後の英文（correctedText）に対する自然で正確な日本語訳。
3. "feedback": なぜそのように修正したのか、文法の指摘、より良い表現のアドバイスなどを短く簡潔な日本語で。

フォーマット:
{
  "correctedText": "...",
  "japaneseTranslation": "...",
  "feedback": "..."
}
`;

    const promptContent = `
英単語: ${word}
お題: ${topic || '指定なし'}
ユーザーの英文: ${userSentence}
`;

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
  } catch (error) {
    console.error('Gemini API Correct Error:', error);
    return NextResponse.json(
      { error: 'Failed to correct sentence' },
      { status: 500 }
    );
  }
}
