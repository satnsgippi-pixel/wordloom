/**
 * 効果音を生成・再生するユーティリティ（Web Audio API使用）
 * iPhoneでも動作するよう、ユーザー操作内で呼び出すこと
 */

/**
 * 正解時の効果音（ピンポン）を再生
 */
export function playCorrectSfx() {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()

    // 1st tone (pin)
    const oscillator1 = audioContext.createOscillator()
    const gainNode1 = audioContext.createGain()
    oscillator1.connect(gainNode1)
    gainNode1.connect(audioContext.destination)

    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
    gainNode1.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode1.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.15
    )

    oscillator1.start(audioContext.currentTime)
    oscillator1.stop(audioContext.currentTime + 0.15)

    // 2nd tone (pon)
    const oscillator2 = audioContext.createOscillator()
    const gainNode2 = audioContext.createGain()
    oscillator2.connect(gainNode2)
    gainNode2.connect(audioContext.destination)

    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15) // E5
    gainNode2.gain.setValueAtTime(0.15, audioContext.currentTime + 0.15)
    gainNode2.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    )

    oscillator2.start(audioContext.currentTime + 0.15)
    oscillator2.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.debug("Failed to play correct SFX:", error)
  }
}

/**
 * 不正解時の効果音（ブー）を再生
 */
export function playWrongSfx() {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = "sawtooth"
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.4
    )

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.4)
  } catch (error) {
    console.debug("Failed to play wrong SFX:", error)
  }
}

/**
 * 互換alias（新コード側が playCorrect / playWrong を呼んでも鳴るように）
 */
export const playCorrect = playCorrectSfx
export const playWrong = playWrongSfx
