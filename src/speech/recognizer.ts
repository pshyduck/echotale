/**
 * Thin wrapper around the browser's Web Speech API.
 *
 * Per ARCHITECTURE.md there is no open-vocabulary recognition: callers pass
 * the transcript to StoryEngine.matchChoice(), which only matches against
 * the current node's closed word list. This wrapper just captures speech
 * and hands back a transcript — it does not know about stories or choices.
 */

export interface RecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export class VoiceRecognizer {
  private recognition: SpeechRecognition | null = null;
  private lang: string;

  constructor(lang: string = 'hu-HU') {
    this.lang = lang;
  }

  static isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  setLanguage(lang: string) {
    this.lang = lang;
  }

  start(handlers: RecognitionHandlers): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      handlers.onError?.('unsupported');
      return;
    }

    this.stop();

    const recognition = new Ctor();
    recognition.lang = this.lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => handlers.onStart?.();
    recognition.onend = () => handlers.onEnd?.();
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      handlers.onError?.(event.error);
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0]?.transcript ?? '';
      handlers.onResult(transcript, result.isFinal);
    };

    this.recognition = recognition;
    recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
    this.recognition = null;
  }

  abort(): void {
    this.recognition?.abort();
    this.recognition = null;
  }
}
