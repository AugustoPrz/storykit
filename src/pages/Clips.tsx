import { useNavigate } from 'react-router-dom';
import { useClipsStore } from '../store/clips';
import ClipCard from '../components/ClipCard';
import './Clips.css';

export default function Clips() {
  const navigate = useNavigate();
  const clips = useClipsStore((s) => s.clips);

  const readyClips = clips.filter((c) => c.videoUrl);

  if (readyClips.length === 0) {
    return (
      <div className="clips clips--empty">
        <span className="clips__empty-text">NO CLIPS YET.</span>
        <button className="clips__empty-link" onClick={() => navigate('/')}>
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
            onClick={() => navigate(`/clip/${clip.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
