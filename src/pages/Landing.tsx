import './Landing.css';

interface Props {
  onSkip: () => void;
}

// Generate placeholder cards with varied heights for masonry effect
const PLACEHOLDERS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  tall: i % 5 === 0,
  // Gradient variations to simulate different drama thumbnails
  gradient: [
    'linear-gradient(180deg, #1a0a0a 0%, #2d1515 40%, #0d0d0d 100%)',
    'linear-gradient(180deg, #0a0a1a 0%, #15152d 40%, #0d0d0d 100%)',
    'linear-gradient(180deg, #1a150a 0%, #2d2515 40%, #0d0d0d 100%)',
    'linear-gradient(180deg, #0a1a15 0%, #152d25 40%, #0d0d0d 100%)',
    'linear-gradient(180deg, #1a0a15 0%, #2d1525 40%, #0d0d0d 100%)',
    'linear-gradient(180deg, #15100a 0%, #2a1f15 40%, #0d0d0d 100%)',
  ][i % 6],
  likes: `${(Math.floor(i * 137.3 + 100) % 900 + 100).toFixed(0)}.${(i * 3) % 10}K`,
  title: [
    'The Last Confession', 'Broken Vows', 'Midnight Lies', 'His Secret Wife',
    'The Billionaire\'s Deal', 'Stolen Hearts', 'Behind Closed Doors', 'Forbidden',
    'The Other Woman', 'Shattered Trust', 'Golden Cage', 'Whispered Sins',
    'The Betrayal', 'After You Left', 'Dangerous Love', 'The Arrangement',
    'Torn Apart', 'Silent Promises', 'The Inheritance', 'Unforgivable',
    'His True Face', 'The Return', 'Burning Bridges', 'One Last Chance',
  ][i],
}));

export default function Landing({ onSkip }: Props) {
  return (
    <div className="landing">
      <div className="landing__grid">
        {PLACEHOLDERS.map((item) => (
          <div
            key={item.id}
            className={`landing__card ${item.tall ? 'landing__card--tall' : ''}`}
            style={{ background: item.gradient }}
          >
            <div className="landing__card-inner">
              <span className="landing__card-title">{item.title}</span>
            </div>
            <div className="landing__overlay">
              <span className="landing__likes">{item.likes}</span>
            </div>
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
