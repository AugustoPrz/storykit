import './Landing.css';

interface Props {
  onSkip: () => void;
}

// Unsplash photos that look like drama/romance thumbnails (free to use)
const IMAGES = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=500&fit=crop',
];

const TITLES = [
  'The Last Confession', 'Broken Vows', 'Midnight Lies', 'His Secret Wife',
  'The Billionaire\'s Deal', 'Stolen Hearts', 'Behind Closed Doors', 'Forbidden',
  'The Other Woman', 'Shattered Trust', 'Golden Cage', 'Whispered Sins',
  'The Betrayal', 'After You Left', 'Dangerous Love', 'The Arrangement',
  'Torn Apart', 'Silent Promises', 'The Inheritance', 'Unforgivable',
  'His True Face', 'The Return', 'Burning Bridges', 'One Last Chance',
];

const PLACEHOLDERS = IMAGES.map((img, i) => ({
  id: i,
  tall: i % 5 === 0,
  image: img,
  likes: `${(Math.floor(i * 137.3 + 100) % 900 + 100).toFixed(0)}.${(i * 3) % 10}K`,
  title: TITLES[i],
}));

export default function Landing({ onSkip }: Props) {
  return (
    <div className="landing">
      <div className="landing__grid">
        {PLACEHOLDERS.map((item) => (
          <div
            key={item.id}
            className={`landing__card ${item.tall ? 'landing__card--tall' : ''}`}
          >
            <img src={item.image} alt="" className="landing__media" loading="lazy" />
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
