import './GenerationProgress.css';

interface Props {
  progress: number;
  message: string;
}

export default function GenerationProgress({ progress, message }: Props) {
  return (
    <div className="gen-progress">
      <div className="gen-progress__bar">
        <div
          className="gen-progress__fill"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
      <span className="gen-progress__label">{message || 'GENERATING...'}</span>
    </div>
  );
}
