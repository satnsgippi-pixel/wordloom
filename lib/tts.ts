// lib/tts.ts
// Browser Web Speech API (speechSynthesis) helper
// Goal:
// - Always set utterance.lang
// - Try to pick a voice that matches the requested lang
// - Handle voices not yet loaded (Chrome/Safari often load async)

export type TTSLang = "en-US" | "ja-JP";

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function getVoicesSafe(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return [];
  if (!("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  return Array.isArray(v) ? v : [];
}

function ensureVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = getVoicesSafe();
    if (existing.length > 0) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }

    // voices may load async
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

    // Safety timeout: resolve anyway
    setTimeout(() => {
      const v = getVoicesSafe();
      cachedVoices = v;
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(v);
    }, 800);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: TTSLang): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  // Prefer exact match (en-US, ja-JP)
  const exact = voices.find((v) => (v.lang || "").toLowerCase() === lang.toLowerCase());
  if (exact) return exact;

  // Then prefer prefix match (en, ja)
  const prefix = lang.split("-")[0].toLowerCase();
  const byPrefix = voices.find((v) => (v.lang || "").toLowerCase().startsWith(prefix));
  if (byPrefix) return byPrefix;

  // Fallback: any default voice
  const def = voices.find((v) => v.default);
  return def ?? voices[0];
}

export async function speak(text: string, lang: TTSLang = "en-US") {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  const t = (text ?? "").trim();
  if (!t) return;

  const synth = window.speechSynthesis;

  // Stop any current speech to avoid overlapping / wrong voice reuse
  try {
    synth.cancel();
  } catch {
    // ignore
  }

  const voices = cachedVoices && cachedVoices.length > 0 ? cachedVoices : await ensureVoicesReady();
  const voice = pickVoice(voices, lang);

  const utter = new SpeechSynthesisUtterance(t);
  utter.lang = lang;

  if (voice) {
    utter.voice = voice;
  }

  // Optional: adjust if you want (keep neutral now)
  // utter.rate = 1.0;
  // utter.pitch = 1.0;
  // utter.volume = 1.0;

  synth.speak(utter);
}
