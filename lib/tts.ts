// lib/tts.ts
// Browser Web Speech API (speechSynthesis) helper
// Improvements:
// - Adjust rate (slower on iPad Safari)
// - Prefer clearer voices (avoid "compact" voices when possible)

export type TTSLang = "en-US" | "ja-JP";

let cachedVoices: SpeechSynthesisVoice[] | null = null;

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

  synth.speak(utter);
}
