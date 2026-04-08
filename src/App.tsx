import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Create from './pages/Create';
import Clips from './pages/Clips';
import ClipPlayer from './pages/ClipPlayer';
import './App.css';

export default function App() {
  const location = useLocation();
  const isPlayerOpen = location.pathname.startsWith('/clip/');

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">STORYKIT</span>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Create />} />
          <Route path="/clips" element={<Clips />} />
        </Routes>
      </main>

      {isPlayerOpen && (
        <Routes>
          <Route path="/clip/:id" element={<ClipPlayer />} />
        </Routes>
      )}

      <nav className="tab-bar">
        <NavLink to="/" end className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" />
            <path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
            <path d="M18 14l.75 1.5L20.25 16.25l-1.5.75L18 18.5l-.75-1.5-1.5-.75 1.5-.75L18 14z" />
          </svg>
        </NavLink>
        <NavLink to="/clips" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </NavLink>
      </nav>
    </div>
  );
}
