import type { Choice } from '../engine/types';
import './ChoiceButton.css';

interface ChoiceButtonProps {
  choice: Choice;
  highlighted: boolean;
  onSelect: (choice: Choice) => void;
}

export function ChoiceButton({ choice, highlighted, onSelect }: ChoiceButtonProps) {
  return (
    <button
      className={`choice-button${highlighted ? ' choice-button--highlighted' : ''}`}
      onClick={() => onSelect(choice)}
    >
      <span className="choice-button__icon" aria-hidden="true">
        {choice.icon}
      </span>
      <span className="choice-button__word-en">{choice.word_en}</span>
      <span className="choice-button__word-hu">({choice.word_hu})</span>
    </button>
  );
}
