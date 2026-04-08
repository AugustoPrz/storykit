import { useParams, useNavigate } from 'react-router-dom';
import { useClipsStore } from '../store/clips';
import { downloadVideo } from '../utils/download';
import VideoPlayer from '../components/VideoPlayer';
import './ClipPlayer.css';

export default function ClipPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clips = useClipsStore((s) => s.clips);
  const removeClip = useClipsStore((s) => s.removeClip);

  const clip = clips.find((c) => c.id === id);

  if (!clip) {
    return (
      <div className="player-modal" onClick={() => navigate(-1)}>
        <div className="player-modal__content">
          <span className="player-modal__not-found">CLIP NOT FOUND</span>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    if (clip.videoUrl) {
      downloadVideo(clip.videoUrl, `${clip.title.replace(/\s+/g, '-').toLowerCase()}.mp4`);
    }
  };

  const handleDelete = () => {
    removeClip(clip.id);
    navigate('/clips');
  };

  const handleContinue = () => {
    navigate('/');
  };

  const date = new Date(clip.createdAt);

  return (
    <div className="player-modal" onClick={() => navigate(-1)}>
      <div className="player-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="player-modal__header">
          <button className="player-modal__close" onClick={() => navigate(-1)}>
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
          <button className="player-modal__btn" onClick={handleContinue}>
            CONTINUE STORY
          </button>
          <button className="player-modal__btn player-modal__btn--danger" onClick={handleDelete}>
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}
