import { useEffect, useRef } from 'react';
import './Landing.css';

interface Props {
  onSkip: () => void;
}

// Cinematic, dramatic, poster-like images — couples, moody scenes, silhouettes
const IMAGES = [
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=300&h=500&fit=crop', // couple silhouette sunset
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=300&h=500&fit=crop', // couple close dramatic
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&h=500&fit=crop', // woman rain window
  'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=300&h=500&fit=crop', // man in suit dark
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=500&fit=crop', // woman dramatic light
  'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=300&h=500&fit=crop', // couple embrace
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=300&h=500&fit=crop', // woman looking away moody
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=500&fit=crop', // wedding couple
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=300&h=500&fit=crop', // man brooding
  'https://images.unsplash.com/photo-1522098543979-ffc7f79a56c4?w=300&h=500&fit=crop', // couple forehead touch
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=500&fit=crop', // woman dramatic portrait
  'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=300&h=500&fit=crop', // city night rain
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=300&h=500&fit=crop', // wedding dress
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&h=500&fit=crop', // man shadow dramatic
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=500&fit=crop', // woman glamour
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=500&fit=crop', // man mysterious
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&h=500&fit=crop', // wedding rings hands
  'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=300&h=500&fit=crop', // abstract red drama
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=500&fit=crop', // man suit confident
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=500&fit=crop', // woman close emotional
  'https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=300&h=500&fit=crop', // luxury car night
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=300&h=500&fit=crop', // wedding ceremony
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=300&h=500&fit=crop', // woman fitness power
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=500&fit=crop', // man intense stare
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
