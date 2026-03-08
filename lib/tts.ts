// lib/tts.ts
// Browser Web Speech API (speechSynthesis) helper
// Improvements:
// - Adjust rate (slower on iPad Safari)
// - Prefer clearer voices (avoid "compact" voices when possible)

export type TTSLang = "en-US" | "ja-JP";

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Web Audio API: ユーザージェスチャ消失後も再生可能にするためグローバルで保持
let audioCtx: AudioContext | null = null;

function getVoicesSafe(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return [];
  if (!("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  return Array.isArray(v) ? v : [];
}

function isIPad(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS sometimes reports "Macintosh" in UA, so detect touch support too.
  const isAppleTabletUA = /iPad/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  return isAppleTabletUA;
}

function ensureVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = getVoicesSafe();
    if (existing.length > 0) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }

    const synth = window.speechSynthesis;

    const onVoicesChanged = () => {
      const v = getVoicesSafe();
      if (v.length > 0) {
        cachedVoices = v;
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(v);
      }
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);

    // Trigger voice loading (some browsers need this)
    try {
      synth.getVoices();
    } catch {
      // ignore
    }

    // Safety timeout: resolve anyway
    setTimeout(() => {
      const v = getVoicesSafe();
      cachedVoices = v;
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(v);
    }, 800);
  });
}

function scoreVoice(v: SpeechSynthesisVoice, lang: TTSLang): number {
  const vLang = (v.lang || "").toLowerCase();
  const target = lang.toLowerCase();
  const prefix = lang.split("-")[0].toLowerCase();

  let score = 0;

  // Language match
  if (vLang === target) score += 100;
  else if (vLang.startsWith(prefix)) score += 60;

  // Prefer local voices (usually better latency)
  if ((v as any).localService) score += 10;

  const name = (v.name || "").toLowerCase();
  const uri = (v.voiceURI || "").toLowerCase();

  // Avoid "compact" voices on Apple when possible (often muffled)
  if (uri.includes("compact") || name.includes("compact")) score -= 25;

  // Prefer commonly clear English voices on Apple (best-effort, names vary by OS)
  if (prefix === "en") {
    if (name.includes("samantha")) score += 20;
    if (name.includes("daniel")) score += 18;
    if (name.includes("karen")) score += 14;
    if (name.includes("alex")) score += 10; // sometimes present on macOS
    // Some Siri voices can be clear; do not penalize by default.
  }

  // Prefer default only as a gentle tiebreaker
  if (v.default) score += 2;

  return score;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: TTSLang): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  // Rank voices by score; pick best
  const ranked = [...voices].sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang));
  const best = ranked[0];
  return best ?? voices[0];
}

export async function speak(text: string, lang: TTSLang = "en-US") {
  if (typeof window === "undefined") return;

  const t = (text ?? "").trim();
  if (!t) return;

  // 📱 同期タイミングで AudioContext を初期化・アンロック（await の前が必須）
  const Ctx = (typeof window !== "undefined" && (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) || null;
  if (Ctx && !audioCtx) {
    audioCtx = new Ctx();
    console.log("[TTS] AudioContext created, state:", audioCtx.state);
  }
  if (audioCtx?.state === "suspended") {
    void audioCtx.resume();
    console.log("[TTS] AudioContext resume() called (was suspended)");
  }
  console.log("[TTS] audioCtx.state before fetch:", audioCtx?.state ?? "null");

  // 1. Google Cloud TTS → Web Audio API で再生
  try {
    console.log("[TTS] fetch start");
    const res = await fetch("/api/tts", {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, lang }),
    });
    console.log("[TTS] fetch done status:", res.status, res.ok ? "OK" : "FAIL");

    if (!res.ok) {
      const errBody = await res.text();
      console.warn("[TTS] fetch non-OK:", res.status, errBody);
    } else {
      const data = await res.json();
      const base64 = data?.audioContent;
      if (base64 && audioCtx) {
        try {
          console.log("[TTS] decodeAudioData start, base64 length:", String(base64).length);
          const binary = atob(String(base64));
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          console.log("[TTS] decodeAudioData ok, duration:", audioBuffer.duration);

          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          source.start(0);
          console.log("[TTS] source.start(0) done, audioCtx.state:", audioCtx.state);
          return;
        } catch (e) {
          console.warn("[TTS] decodeAudioData or play failed:", e);
        }
      } else {
        console.log("[TTS] no audioContent or no audioCtx, base64:", !!base64, "audioCtx:", !!audioCtx);
      }
    }
  } catch (err) {
    console.warn("[TTS] fetch error:", err);
  }

  // 2. Fallback to Web Speech API (speechSynthesis)
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;

  const voices = cachedVoices && cachedVoices.length > 0 ? cachedVoices : await ensureVoicesReady();
  const voice = pickVoice(voices, lang);

  // Stop any current speech to avoid overlapping / wrong voice reuse immediately before speaking
  try {
    synth.cancel();
  } catch {
    // ignore
  }

  // Ensure returning a brand new utterance instance every time
  const utter = new SpeechSynthesisUtterance(t);
  
  // Hold a reference globally to prevent Safari from garbage collecting it mid-speech
  activeUtterance = utter;

  utter.lang = lang;

  if (voice) utter.voice = voice;

  // ---- Speed / clarity tweaks ----
  const ipad = isIPad();

  // iPad Safari tends to sound fast; slow it down slightly.
  if (lang.startsWith("en")) {
    utter.rate = ipad ? 0.85 : 0.95; // adjust to taste
    utter.pitch = ipad ? 1.05 : 1.0; // tiny lift can reduce "muffled" feel
  } else {
    // Japanese: keep close to neutral (you can tweak later)
    utter.rate = ipad ? 0.95 : 1.0;
    utter.pitch = 1.0;
  }

  utter.volume = 1.0;

  // Cleanup to prevent memory leaks and stabilize the queue
  utter.onend = () => {
    activeUtterance = null;
  };
  
  utter.onerror = (e) => {
    console.warn("TTS Error:", e);
    activeUtterance = null;
  };

  synth.speak(utter);
}
