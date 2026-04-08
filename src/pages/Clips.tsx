import { useClipsStore } from '../store/clips';
import ClipCard from '../components/ClipCard';
import type { AppView } from '../App';
import './Clips.css';

interface Props {
  onPlay: (clipId: string) => void;
  onViewChange: (view: AppView) => void;
}

export default function Clips({ onPlay, onViewChange }: Props) {
  const clips = useClipsStore((s) => s.clips);
  const chatMessages = useClipsStore((s) => s.chatMessages);
  const clearChat = useClipsStore((s) => s.clearChat);

  const readyClips = clips.filter((c) => c.videoUrl);
  const hasSession = chatMessages.length > 0;

  const handleNew = () => {
    clearChat();
    onViewChange('create');
  };

  if (readyClips.length === 0) {
    return (
      <div className="clips clips--empty">
        <div className="clips__actions">
          <button className="clips__switch-btn" onClick={() => onViewChange('create')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" />
              <path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
            </svg>
          </button>
          {hasSession && (
            <button className="clips__new" onClick={handleNew}>NEW</button>
          )}
        </div>
        <span className="clips__empty-text">NO CLIPS YET.</span>
        <button className="clips__empty-link" onClick={() => onViewChange('create')}>
          CREATE YOUR FIRST STORY
        </button>
      </div>
    );
  }

  return (
    <div className="clips">
      <div className="clips__actions">
        <button className="clips__switch-btn" onClick={() => onViewChange('create')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" />
            <path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
          </svg>
        </button>
        {hasSession && (
          <button className="clips__new" onClick={handleNew}>NEW</button>
        )}
      </div>
      <div className="clips__grid">
        {readyClips.map((clip) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            onClick={() => onPlay(clip.id)}
          />
        ))}
      </div>
    </div>
  );
}
