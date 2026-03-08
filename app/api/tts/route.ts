import { NextResponse } from "next/server";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" } as const;

export async function POST(req: Request) {
  try {
    const { text, lang } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400, headers: CORS_HEADERS });
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      console.error("Missing GOOGLE_TTS_API_KEY text to speech api key.");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500, headers: CORS_HEADERS });
    }
    
    // Choose appropriate voice depending on the language requested.
    let voiceName = "en-US-Neural2-F";
    let languageCode = "en-US";
    if (lang === "ja-JP") {
      voiceName = "ja-JP-Neural2-B"; // Use a Japanese Neural2 voice
      languageCode = "ja-JP";
    }

    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    // audioEncoding は必ず MP3（OGG_OPUS 等は iOS Safari の decodeAudioData で問題になるため）
    const body = {
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: "MP3" as const },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google TTS Backend fail:", response.status, errorText);
      return NextResponse.json(
        { error: "Google TTS API request failed." },
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    const data = await response.json();
    return NextResponse.json({ audioContent: data.audioContent }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error in /api/tts:", error);
    return NextResponse.json(
      { error: "Failed to generate TTS audio" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
