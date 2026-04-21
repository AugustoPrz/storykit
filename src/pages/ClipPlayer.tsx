import { useClipsStore } from '../store/clips';
import { useAuthStore } from '../store/auth';
import { downloadVideo } from '../utils/download';
import VideoPlayer from '../components/VideoPlayer';
import './ClipPlayer.css';

interface Props {
  clipId: string;
  onClose: () => void;
  onContinue?: (clipId: string) => void;
}

export default function ClipPlayer({ clipId, onClose, onContinue }: Props) {
  const clips = useClipsStore((s) => s.clips);
  const publicClips = useClipsStore((s) => s.publicClips);
  const userClips = useClipsStore((s) => s.userClips);
  const removeClip = useClipsStore((s) => s.removeClip);
  const user = useAuthStore((s) => s.user);

  // Search all sources — local drafts, user clips, and public feed
  const clip =
    clips.find((c) => c.id === clipId) ||
    userClips.find((c) => c.id === clipId) ||
    publicClips.find((c) => c.id === clipId);

  if (!clip) {
    return (
      <div className="player-modal" onClick={onClose}>
        <div className="player-modal__content">
          <span className="player-modal__not-found">CLIP NOT FOUND</span>
        </div>
      </div>
    );
  }

  const isOwner = !!(user && clip.userId && user.id === clip.userId);

  const handleDownload = () => {
    if (clip.videoUrl) {
      downloadVideo(clip.videoUrl, `${clip.title.replace(/\s+/g, '-').toLowerCase()}.mp4`);
    }
  };

  const handleDelete = () => {
    removeClip(clip.id);
    onClose();
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(clip.id);
      onClose();
    }
  };

  const date = new Date(clip.createdAt);

  return (
    <div className="player-modal" onClick={onClose}>
      <div className="player-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="player-modal__header">
          <button className="player-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="player-modal__video">
          <VideoPlayer url={clip.videoUrl} autoPlay controls />
        </div>

        <div className="player-modal__info">
          <span className="player-modal__label">TITLE</span>
          <span className="player-modal__value">{clip.title}</span>

          <span className="player-modal__label">PROMPT</span>
          <span className="player-modal__value player-modal__value--dim">{clip.prompt}</span>

          <div className="player-modal__meta">
            <span>{clip.duration}s</span>
            <span>{clip.style}</span>
            <span>{date.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="player-modal__actions">
          <button className="player-modal__btn" onClick={handleDownload}>
            DOWNLOAD
          </button>
          {isOwner && onContinue && (
            <button className="player-modal__btn player-modal__btn--accent" onClick={handleContinue}>
              CONTINUE STORY
            </button>
          )}
          {isOwner && (
            <button className="player-modal__btn-icon player-modal__btn-icon--danger" onClick={handleDelete} title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
