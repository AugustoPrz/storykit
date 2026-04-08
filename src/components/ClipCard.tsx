import type { ClipMetadata } from '../services/video-generation/types';
import './ClipCard.css';

interface Props {
  clip: ClipMetadata;
  onClick: () => void;
}

export default function ClipCard({ clip, onClick }: Props) {
  const date = new Date(clip.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <button className="clip-card" onClick={onClick}>
      <div className="clip-card__thumb">
        {clip.videoUrl ? (
          <video src={clip.videoUrl} preload="metadata" muted />
        ) : (
          <div className="clip-card__placeholder" />
        )}
        <span className="clip-card__duration">{clip.duration}s</span>
      </div>
      <div className="clip-card__info">
        <span className="clip-card__title">{clip.title}</span>
        <span className="clip-card__time">{timeStr}</span>
      </div>
    </button>
  );
}
