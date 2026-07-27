import './MicButton.css';

interface MicButtonProps {
  listening: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function MicButton({ listening, disabled, onClick }: MicButtonProps) {
  return (
    <button
      className={`mic-button${listening ? ' mic-button--listening' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? 'Hallgatás leállítása' : 'Mondd ki a választásod'}
    >
      🎤
    </button>
  );
}
