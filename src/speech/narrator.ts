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

function speak(text: string, lang: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

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
