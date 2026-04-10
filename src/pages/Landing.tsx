import { useClipsStore } from '../store/clips';
import './Landing.css';

interface Props {
  onSkip: () => void;
}

// Fallback showcase videos when no clips exist yet
const SHOWCASE_POSTERS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
];

export default function Landing({ onSkip }: Props) {
  const clips = useClipsStore((s) => s.clips).filter((c) => c.videoUrl);

  // Use real clips if available, otherwise fill with placeholders
  const gridItems = clips.length > 0
    ? clips
    : SHOWCASE_POSTERS.map((poster, i) => ({
        id: `placeholder-${i}`,
        videoUrl: '',
        title: ['Untold Secrets', 'The Last Letter', 'Midnight Vow', 'Broken Promise'][i],
        poster,
      }));

  return (
    <div className="landing">
      <div className="landing__grid">
        {gridItems.map((item, i) => (
          <div
            key={item.id}
            className={`landing__card ${i === 0 ? 'landing__card--tall' : ''}`}
          >
            {'videoUrl' in item && item.videoUrl ? (
              <video
                src={`${item.videoUrl}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                className="landing__media"
              />
            ) : (
              <div className="landing__placeholder" />
            )}
            <div className="landing__overlay">
              {'duration' in item && (
                <span className="landing__likes">
                  {Math.floor(Math.random() * 900 + 100)}.{Math.floor(Math.random() * 9)}K
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Duplicate to fill the grid */}
        {gridItems.map((item) => (
          <div key={`dup-${item.id}`} className="landing__card">
            {'videoUrl' in item && item.videoUrl ? (
              <video
                src={`${item.videoUrl}#t=0.5`}
                muted
                playsInline
                preload="metadata"
                className="landing__media"
              />
            ) : (
              <div className="landing__placeholder" />
            )}
          </div>
        ))}
      </div>

      <div className="landing__hero">
        <h1 className="landing__title">STORYKIT</h1>
        <p className="landing__subtitle">AI-powered drama series generator</p>
        <p className="landing__desc">Create cinematic micro-dramas with AI. Write a prompt, generate a script, produce a video — in seconds.</p>
        <button className="landing__cta" onClick={onSkip}>
          START CREATING
        </button>
      </div>

      <button className="landing__skip" onClick={onSkip}>
        SKIP
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
