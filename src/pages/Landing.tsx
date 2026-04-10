import { useEffect, useRef } from 'react';
import './Landing.css';

interface Props {
  onSkip: () => void;
}

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

const LIKES = IMAGES.map((_, i) => `${(Math.floor(i * 137.3 + 100) % 900 + 100).toFixed(0)}.${(i * 3) % 10}K`);

// Split images into columns (5 cols, 5 images each, duplicated for infinite scroll)
function buildColumns(colCount: number) {
  const cols: { image: string; likes: string }[][] = Array.from({ length: colCount }, () => []);
  IMAGES.forEach((img, i) => {
    cols[i % colCount].push({ image: img, likes: LIKES[i] });
  });
  // Duplicate each column for seamless loop
  return cols.map((col) => [...col, ...col, ...col]);
}

export default function Landing({ onSkip }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const columns = gridRef.current?.querySelectorAll('.landing__column');
    if (!columns) return;

    const animations: Animation[] = [];
    columns.forEach((col, i) => {
      const inner = col.querySelector('.landing__column-inner') as HTMLElement;
      if (!inner) return;
      const dir = i % 2 === 0 ? -1 : 1;
      const duration = 25000 + i * 5000;
      const totalHeight = inner.scrollHeight / 3; // since we tripled the content

      const anim = inner.animate(
        [
          { transform: `translateY(${dir === -1 ? '0px' : `-${totalHeight}px`})` },
          { transform: `translateY(${dir === -1 ? `-${totalHeight}px` : '0px'})` },
        ],
        { duration, iterations: Infinity, easing: 'linear' }
      );
      animations.push(anim);
    });

    return () => animations.forEach((a) => a.cancel());
  }, []);

  const cols = buildColumns(5);

  return (
    <div className="landing">
      <div className="landing__grid" ref={gridRef}>
        {cols.map((col, ci) => (
          <div key={ci} className="landing__column">
            <div className="landing__column-inner">
              {col.map((item, ii) => (
                <div key={ii} className="landing__card">
                  <img src={item.image} alt="" className="landing__media" loading="lazy" />
                  <div className="landing__card-likes">
                    <span className="landing__likes">{item.likes}</span>
                  </div>
                </div>
              ))}
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
