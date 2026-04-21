import { useState, useEffect } from 'react';
import { useClipsStore } from './store/clips';
import { useAuthStore, initAuth } from './store/auth';
import { signOut } from './services/auth/auth';
import Landing from './pages/Landing';
import Create from './pages/Create';
import Clips from './pages/Clips';
import ClipPlayer from './pages/ClipPlayer';
import Auth from './pages/Auth';
import './App.css';

const USD_PER_CREDIT = 10 / 680;

export type AppView = 'landing' | 'clips' | 'auth' | 'create';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [continueFromClipId, setContinueFromClipId] = useState<string | null>(null);
  const creditsUsed = useClipsStore((s) => s.creditsUsed);
  const loadPublicClips = useClipsStore((s) => s.loadPublicClips);
  const loadUserClips = useClipsStore((s) => s.loadUserClips);
  const clearUserClips = useClipsStore((s) => s.clearUserClips);
  const publicClips = useClipsStore((s) => s.publicClips);
  const user = useAuthStore((s) => s.user);

  const clipCount = publicClips.length;

  // Bootstrap auth + public clips
  useEffect(() => {
    initAuth();
    loadPublicClips();
  }, [loadPublicClips]);

  // When user signs in/out, sync user's clips
  useEffect(() => {
    if (user) {
      loadUserClips(user.id);
    } else {
      clearUserClips();
    }
  }, [user, loadUserClips, clearUserClips]);

  const handleContinueFromClip = (clipId: string) => {
    if (!user) {
      setView('auth');
      return;
    }
    setContinueFromClipId(clipId);
    setView('create');
  };

  const handleSignOut = async () => {
    await signOut();
    setView('landing');
  };

  if (view === 'landing') {
    return <Landing onSkip={() => setView('clips')} />;
  }

  // Protected: Create requires auth
  if (view === 'create' && !user) {
    return <Auth onViewChange={setView} />;
  }

  if (view === 'auth') {
    return <Auth onViewChange={setView} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">DRAMAMIX</span>
        <div className="app-header__right">
          {creditsUsed > 0 && (
            <span className="app-credits">
              {creditsUsed.toFixed(1)} CR · ${(creditsUsed * USD_PER_CREDIT).toFixed(2)}
              {clipCount > 0 && ` · ${clipCount} clip${clipCount !== 1 ? 's' : ''}`}
            </span>
          )}
          {user ? (
            <button className="app-auth-btn" onClick={handleSignOut}>LOGOUT</button>
          ) : (
            <button className="app-auth-btn" onClick={() => setView('auth')}>LOGIN</button>
          )}
        </div>
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
