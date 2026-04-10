import { useState } from 'react';
import { useClipsStore } from './store/clips';
import Landing from './pages/Landing';
import Create from './pages/Create';
import Clips from './pages/Clips';
import ClipPlayer from './pages/ClipPlayer';
import './App.css';

const USD_PER_CREDIT = 10 / 680;

export type AppView = 'landing' | 'create' | 'clips';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [continueFromClipId, setContinueFromClipId] = useState<string | null>(null);
  const creditsUsed = useClipsStore((s) => s.creditsUsed);
  const clipCount = useClipsStore((s) => s.clips.filter((c) => c.videoUrl).length);

  const handleContinueFromClip = (clipId: string) => {
    setContinueFromClipId(clipId);
    setView('create');
  };

  if (view === 'landing') {
    return <Landing onSkip={() => setView('create')} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">STORYKIT</span>
        {creditsUsed > 0 && (
          <span className="app-credits">
            {creditsUsed.toFixed(1)} CR · ${(creditsUsed * USD_PER_CREDIT).toFixed(2)}
            {clipCount > 0 && ` · ${clipCount} clip${clipCount !== 1 ? 's' : ''}`}
          </span>
        )}
      </header>

      <main className="app-content">
        {view === 'create' ? (
          <Create
            onViewChange={setView}
            continueFromClipId={continueFromClipId}
            onContinueHandled={() => setContinueFromClipId(null)}
          />
        ) : (
          <Clips onPlay={setPlayerId} onViewChange={setView} />
        )}
      </main>

      {playerId && (
        <ClipPlayer
          clipId={playerId}
          onClose={() => setPlayerId(null)}
          onContinue={handleContinueFromClip}
        />
      )}
    </div>
  );
}
