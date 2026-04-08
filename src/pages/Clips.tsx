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

  const readyClips = clips.filter((c) => c.videoUrl);

  if (readyClips.length === 0) {
    return (
      <div className="clips clips--empty">
        <span className="clips__empty-text">NO CLIPS YET.</span>
        <button className="clips__empty-link" onClick={() => onViewChange('create')}>
          CREATE YOUR FIRST STORY
        </button>
      </div>
    );
  }

  return (
    <div className="clips">
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
