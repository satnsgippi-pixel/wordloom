import { useCallback } from 'react';

/**
 * 効果音を生成・再生するユーティリティ（Web Audio API使用）
 * シングルトンパターンにより、メモリ負荷を最小限に抑えています。
 */

let sharedContext: AudioContext | null = null;

const getContext = () => {
  if (typeof window === "undefined") return null;
  if (!sharedContext) {
    sharedContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedContext.state === "suspended") {
    sharedContext.resume();
  }
  return sharedContext;
};

// 実際の再生ロジック（合成音）
const playCorrectSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.frequency.setValueAtTime(523.25, now);
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  osc1.start(now); osc1.stop(now + 0.15);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc2.frequency.setValueAtTime(659.25, now + 0.15);
  gain2.gain.setValueAtTime(0.15, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc2.start(now + 0.15); osc2.stop(now + 0.3);
};

const playWrongSound = () => {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, now);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  osc.start(now); osc.stop(now + 0.4);
};

/**
 * Cursor Agentが他のコンポーネントで呼び出しているフック形式
 */
export const useSfx = () => {
  const playCorrect = useCallback(() => {
    playCorrectSound();
  }, []);

  const playWrong = useCallback(() => {
    playWrongSound();
  }, []);

  return { playCorrect, playWrong };
};

/**
 * 以前の直接呼び出し形式も一応残しておく（エラー防止用）
 */
export const playCorrect = playCorrectSound;
export const playWrong = playWrongSound;
export const playCorrectSfx = playCorrectSound;
export const playWrongSfx = playWrongSound;
