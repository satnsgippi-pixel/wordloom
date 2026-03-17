import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { word, sentence } = await request.json();

    if (!word || typeof word !== 'string' || !sentence || typeof sentence !== 'string') {
      return NextResponse.json(
        { error: 'Valid word and sentence strings are required' },
        { status: 400 }
      );
    }

    const systemInstruction = `
あなたは英語辞書エージェントです。

入力された {word/phrase} が、その {sentence} の中でどのように使われているかを分析してください。

出力は必ず以下のJSON形式のみで返してください：
{ "meaning": "単語の日本語意味", "translation": "例文の自然な和訳" }

余計な解説やマークダウン記号は一切含めないでください。
`;

    const promptContent = `word/phrase: ${word}
sentence: ${sentence}`;

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

    // Try to parse the response to ensure it's valid JSON before returning
    const jsonResponse = JSON.parse(response.text);

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Gemini API AI-Complete Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate completion' },
      { status: 500 }
    );
  }
}
