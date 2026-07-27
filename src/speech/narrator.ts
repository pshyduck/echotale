/**
 * Placeholder narrator using the browser's SpeechSynthesis (TTS) API.
 * ARCHITECTURE.md calls for pre-recorded human audio (e.g. ElevenLabs) in
 * production — this is a stand-in so the story is audible before those
 * audio files exist.
 */

// Fallback in case the browser never fires 'end'/'error' (seen when a tab
// loses audio focus, or has no audio output device at all) — without this
// the story would get stuck narrating forever.
const MAX_UTTERANCE_MS = 15000;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Voice list loads asynchronously on first use in some browsers.
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

/**
 * The browser's default pick for a given lang is often the most robotic
 * voice installed. Network-backed voices (e.g. Chrome's "Google" voices)
 * are consistently more natural, so prefer those when available.
 */
function pickBestVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const langPrefix = lang.split('-')[0].toLowerCase();
  const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix));
  if (matching.length === 0) return undefined;
  return matching.find((voice) => !voice.localService) ?? matching[0];
}

async function speak(text: string, lang: string): Promise<void> {
  if (!('speechSynthesis' in window)) return;

  const voices = await loadVoices();
  const voice = pickBestVoice(voices, lang);

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    if (voice) utterance.voice = voice;

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve();
    };
    const timeoutId = window.setTimeout(settle, MAX_UTTERANCE_MS);

    utterance.onend = settle;
    utterance.onerror = settle;
    window.speechSynthesis.speak(utterance);
  });
}

export function cancelNarration(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/** Speaks the Hungarian narration, then the English recap if present. */
export async function narrateNode(textHu: string, textEn?: string): Promise<void> {
  cancelNarration();
  await speak(textHu, 'hu-HU');
  if (textEn) {
    await speak(textEn, 'en-US');
  }
}
