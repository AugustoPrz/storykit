import { useState } from 'react';
import { useClipsStore } from '../store/clips';
import { useAuthStore } from '../store/auth';
import ClipCard from '../components/ClipCard';
import type { AppView } from '../App';
import './Clips.css';

interface Props {
  onPlay: (clipId: string) => void;
  onViewChange: (view: AppView) => void;
}

type Filter = 'all' | 'mine';

export default function Clips({ onViewChange, onPlay }: Props) {
  const publicClips = useClipsStore((s) => s.publicClips);
  const userClips = useClipsStore((s) => s.userClips);
  const user = useAuthStore((s) => s.user);

  const [filter, setFilter] = useState<Filter>('all');

  // "All" shows all public clips. "Mine" shows only the user's clips.
  // Both are filtered to clips with a video (drafts never surface).
  const clipsToShow = (filter === 'mine' && user ? userClips : publicClips).filter((c) => c.videoUrl);

  const handleCreateClick = () => {
    if (!user) {
      onViewChange('auth');
    } else {
      onViewChange('create');
    }
  };

  return (
    <div className={`clips ${clipsToShow.length === 0 ? 'clips--empty' : ''}`}>
      <div className="clips__actions">
        <button className="clips__switch-btn" onClick={handleCreateClick}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" />
            <path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
          </svg>
        </button>
        {user && (
          <div className="clips__filter">
            <button
              className={`clips__filter-btn ${filter === 'all' ? 'clips__filter-btn--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              ALL
            </button>
            <button
              className={`clips__filter-btn ${filter === 'mine' ? 'clips__filter-btn--active' : ''}`}
              onClick={() => setFilter('mine')}
            >
              MINE
            </button>
          </div>
        )}
      </div>

      {clipsToShow.length === 0 ? (
        <div className="clips__empty-state">
          <span className="clips__empty-text">
            {filter === 'mine' ? 'NO CLIPS YET.' : 'NO PUBLIC CLIPS YET.'}
          </span>
          <button className="clips__empty-link" onClick={handleCreateClick}>
            {user ? 'CREATE YOUR FIRST STORY' : 'SIGN IN TO CREATE'}
          </button>
        </div>
      ) : (
        <div className="clips__grid">
          {clipsToShow.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onClick={() => onPlay(clip.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
