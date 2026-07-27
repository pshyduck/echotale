import { useEffect, useRef, useState } from 'react';
import { StoryEngine } from '../engine/storyEngine';
import type { Choice, Story } from '../engine/types';
import { cancelNarration, narrateNode } from '../speech/narrator';
import { VoiceRecognizer } from '../speech/recognizer';
import storyData from '../data/stories/sarkany-kalandja.json';
import { ChoiceButton } from './ChoiceButton';
import { MicButton } from './MicButton';
import './StoryPlayer.css';

type FeedbackType = 'none' | 'nomatch' | 'unsupported';

export function StoryPlayer() {
  const engineRef = useRef(new StoryEngine(storyData as Story));
  const recognizerRef = useRef(new VoiceRecognizer('hu-HU'));
  const [node, setNode] = useState(engineRef.current.getCurrentNode());
  const [narrating, setNarrating] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [matchedChoice, setMatchedChoice] = useState<Choice | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message?: string }>({
    type: 'none',
  });

  useEffect(() => {
    let cancelled = false;
    setNarrating(true);
    setFeedback({ type: 'none' });
    narrateNode(node.text_hu, node.text_en).then(() => {
      if (cancelled) return;
      setNarrating(false);
      if (node.choices.length > 0) {
        startListening();
      }
    });
    return () => {
      cancelled = true;
      cancelNarration();
      recognizerRef.current.stop();
      setListening(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);

  function startListening() {
    if (!VoiceRecognizer.isSupported()) {
      setFeedback({
        type: 'unsupported',
        message: 'A böngésződ nem támogatja a hangfelismerést. Kattints a válaszra!',
      });
      return;
    }
    setFeedback({ type: 'none' });
    setInterimTranscript('');
    recognizerRef.current.start({
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onError: (error) => {
        setListening(false);
        if (error !== 'no-speech' && error !== 'aborted') {
          setFeedback({ type: 'nomatch', message: 'Hiba történt. Próbáld újra, vagy kattints!' });
        }
      },
      onResult: (transcript, isFinal) => {
        if (!isFinal) {
          setInterimTranscript(transcript);
          return;
        }
        setInterimTranscript('');
        const choice = engineRef.current.matchChoice(transcript);
        if (choice) {
          advance(choice);
        } else {
          setFeedback({
            type: 'nomatch',
            message: `Nem értettem: "${transcript}". Próbáld újra, vagy kattints!`,
          });
        }
      },
    });
  }

  function advance(choice: Choice) {
    cancelNarration();
    recognizerRef.current.stop();
    setListening(false);
    setNarrating(false);
    setMatchedChoice(choice);
    setTrail((prev) => [...prev, choice.icon]);
    window.setTimeout(() => {
      const next = engineRef.current.selectChoice(choice);
      setMatchedChoice(null);
      setFeedback({ type: 'none' });
      setNode(next);
    }, 500);
  }

  function handleMicClick() {
    if (listening) {
      recognizerRef.current.stop();
      setListening(false);
      return;
    }
    startListening();
  }

  function handleReplay() {
    cancelNarration();
    recognizerRef.current.stop();
    setListening(false);
    setNarrating(true);
    setFeedback({ type: 'none' });
    narrateNode(node.text_hu, node.text_en).then(() => {
      setNarrating(false);
      if (node.choices.length > 0) {
        startListening();
      }
    });
  }

  function handleRestart() {
    cancelNarration();
    recognizerRef.current.stop();
    setListening(false);
    setFeedback({ type: 'none' });
    setTrail([]);
    setNode(engineRef.current.restart());
  }

  const isEnding = node.choices.length === 0;

  return (
    <div className="story-player">
      <h1>{engineRef.current.getStoryTitle()}</h1>

      {trail.length > 0 && (
        <div className="story-player__trail" aria-hidden="true">
          {trail.map((icon, index) => (
            <span key={index} className="story-player__trail-icon">
              {icon}
            </span>
          ))}
        </div>
      )}

      <p className={`story-player__text${narrating ? ' story-player__text--narrating' : ''}`}>
        {node.text_hu}
      </p>

      {!isEnding && (
        <>
          <div className="story-player__choices">
            {node.choices.map((choice) => (
              <ChoiceButton
                key={choice.next}
                choice={choice}
                highlighted={matchedChoice === choice}
                onSelect={advance}
              />
            ))}
          </div>

          <div className="story-player__controls">
            <button
              className="icon-button"
              onClick={handleReplay}
              disabled={narrating}
              aria-label="Mese újra felolvasása"
            >
              🔁
            </button>
            <MicButton listening={listening} disabled={narrating} onClick={handleMicClick} />
          </div>

          {listening && (
            <p className="story-player__status">
              {interimTranscript ? `Hallak: "${interimTranscript}"` : 'Hallgatlak…'}
            </p>
          )}
          {feedback.message && <p className="story-player__feedback">{feedback.message}</p>}
        </>
      )}

      {isEnding && (
        <button className="story-player__restart" onClick={handleRestart}>
          Új mese ▶️ Start over
        </button>
      )}
    </div>
  );
}
