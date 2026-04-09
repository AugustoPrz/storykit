import type { Script } from '../services/video-generation/types';
import GenerationProgress from './GenerationProgress';
import VideoPlayer from './VideoPlayer';
import './ScriptCard.css';

interface Props {
  script: Script;
  onGenerate?: () => void;
  onContinue?: () => void;
  onEnd?: () => void;
  isGenerating?: boolean;
  generationProgress?: number;
  generationMessage?: string;
  generationError?: string;
  videoUrl?: string;
}

export default function ScriptCard({
  script,
  onGenerate,
  onContinue,
  onEnd,
  isGenerating,
  generationProgress = 0,
  generationMessage = '',
  generationError,
  videoUrl,
}: Props) {
  return (
    <div className="script-card">
      <div className="script-card__header">
        <span className="script-card__label">TITLE</span>
        <span className="script-card__value">{script.title}</span>
      </div>

      <div className="script-card__row">
        <div>
          <span className="script-card__label">STYLE</span>
          <span className="script-card__value">{script.style}</span>
        </div>
        <div>
          <span className="script-card__label">DURATION</span>
          <span className="script-card__value">{script.duration_seconds}s</span>
        </div>
      </div>

      <div className="script-card__shots">
        <span className="script-card__label">SHOTS ({script.shots.length})</span>
        {script.shots.map((shot) => (
          <div key={shot.shot_number} className="script-card__shot">
            <span className="script-card__shot-num">#{shot.shot_number}</span>
            <span className="script-card__shot-detail">{shot.visual}</span>
            <span className="script-card__shot-camera">{shot.camera}</span>
            {shot.dialogue && (
              <span className="script-card__shot-dialogue">{shot.dialogue}</span>
            )}
          </div>
        ))}
      </div>

      {script.cliffhanger && script.cliffhanger !== 'END' && (
        <div className="script-card__footer">
          <span className="script-card__label">CLIFFHANGER</span>
          <span className="script-card__value">{script.cliffhanger}</span>
        </div>
      )}
      {script.cliffhanger === 'END' && (
        <div className="script-card__footer">
          <span className="script-card__label">FINALE</span>
        </div>
      )}

      {videoUrl ? (
        <div className="script-card__video">
          <VideoPlayer url={videoUrl} />
          {(onContinue || onEnd) && (
            <div className="script-card__story-actions">
              {onContinue && (
                <button className="script-card__continue" onClick={onContinue}>
                  CONTINUE
                </button>
              )}
              {onEnd && (
                <button className="script-card__end" onClick={onEnd}>
                  END STORY
                </button>
              )}
            </div>
          )}
        </div>
      ) : isGenerating ? (
        <GenerationProgress progress={generationProgress} message={generationMessage} />
      ) : (
        <>
          {generationError && (
            <div className="script-card__error">{generationError}</div>
          )}
          {onGenerate && (
            <button className="script-card__generate" onClick={onGenerate}>
              {generationError ? 'RETRY' : 'GENERATE VIDEO'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
