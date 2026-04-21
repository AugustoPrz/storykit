import { useState } from 'react';
import { signIn, signUp } from '../services/auth/auth';
import type { AppView } from '../App';
import './Auth.css';

interface Props {
  onViewChange: (view: AppView) => void;
}

type Mode = 'login' | 'signup';

export default function Auth({ onViewChange }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const data = await signUp(email.trim(), password);
        if (data.session) {
          onViewChange('create');
        } else {
          setInfo('Check your email to confirm your account.');
        }
      } else {
        await signIn(email.trim(), password);
        onViewChange('create');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__actions">
        <button className="auth__back" onClick={() => onViewChange('clips')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="auth__box">
        <div className="auth__tabs">
          <button
            className={`auth__tab ${mode === 'login' ? 'auth__tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(null); setInfo(null); }}
          >
            LOGIN
          </button>
          <button
            className={`auth__tab ${mode === 'signup' ? 'auth__tab--active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
          >
            SIGN UP
          </button>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="auth__label">EMAIL</label>
          <input
            className="auth__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label className="auth__label">PASSWORD</label>
          <input
            className="auth__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />

          {error && <div className="auth__error">{error}</div>}
          {info && <div className="auth__info">{info}</div>}

          <button
            type="submit"
            className="auth__submit"
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? '...' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}
