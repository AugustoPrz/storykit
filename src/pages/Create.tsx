import { useState, useRef, useEffect } from 'react';
import { useClipsStore } from '../store/clips';
import { generateScript } from '../services/storytelling/gemini';
import { buildPrompt } from '../services/storytelling/prompts';
import { generateVideo } from '../services/video-generation';
import { extractLastFrame } from '../utils/extractFrame';
import ChatMessage from '../components/ChatMessage';
import type { ChatMessage as ChatMessageType } from '../services/video-generation/types';
import type { AppView } from '../App';
import './Create.css';

interface Props {
  onViewChange: (view: AppView) => void;
  continueFromClipId?: string | null;
  onContinueHandled?: () => void;
}

export default function Create({ onViewChange, continueFromClipId, onContinueHandled }: Props) {
  const [input, setInput] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    chatMessages,
    generationStatus,
    currentClipId,
    addMessage,
    updateMessage,
    clearChat,
    setGenerationStatus,
    addClip,
    updateClip,
    setCurrentClipId,
    clips,
    addCredits,
  } = useClipsStore();

  const currentClip = clips.find((c) => c.id === currentClipId);
  const isWorking = generationStatus.phase === 'scripting' || generationStatus.phase === 'generating';
  // Series is complete when the last generated clip's cliffhanger is "END"
  const isSeriesComplete = currentClip?.script?.cliffhanger === 'END' && !!currentClip?.videoUrl;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, generationStatus]);

  // Handle continue-from-clip triggered from gallery
  useEffect(() => {
    if (continueFromClipId && !isWorking) {
      const clip = clips.find((c) => c.id === continueFromClipId);
      if (clip?.script) {
        // Clear chat and set up the clip as the current context
        clearChat();
        // Re-add the clip with its video as the starting point
        addClip({
          id: clip.id,
          title: clip.title,
          prompt: clip.prompt,
          script: clip.script,
          videoUrl: clip.videoUrl,
          thumbnailUrl: clip.thumbnailUrl,
          duration: clip.duration,
          createdAt: clip.createdAt,
          style: clip.style,
          parentClipId: clip.parentClipId,
        });
        setCurrentClipId(clip.id);
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          script: clip.script,
          clipId: clip.id,
        });
        onContinueHandled?.();
      }
    }
  }, [continueFromClipId]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isWorking) return;

    setInput('');

    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMsg);

    const assistantMsgId = crypto.randomUUID();
    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: 'WRITING SCRIPT...',
      timestamp: Date.now(),
    });

    setGenerationStatus({ phase: 'scripting', progress: 0, message: 'WRITING SCRIPT...' });

    try {
      // Find the last clip with a video to use as reference for continuation
      // Priority: currentClip (if it has video) > any clip in chat with video
      const refClip = currentClip?.videoUrl
        ? currentClip
        : clips.find((c) => {
            const inChat = chatMessages.some((m) => m.clipId === c.id);
            return inChat && c.videoUrl;
          });
      const previousScript = refClip?.script;
      // Count episodes by walking the parent chain from the reference clip
      let episodeNumber = 1;
      if (refClip) {
        let wId: string | undefined = refClip.id;
        while (wId) {
          episodeNumber++;
          const w = clips.find((c) => c.id === wId);
          wId = w?.parentClipId;
        }
      }
      const isFinalEpisode = text.toUpperCase().includes('END');
      const script = await generateScript(
        text,
        refClip ? previousScript : undefined,
        refClip ? episodeNumber : undefined,
        refClip ? isFinalEpisode : undefined
      );

      updateMessage(assistantMsgId, {
        content: '',
        script,
      });

      const clipId = crypto.randomUUID();
      addClip({
        id: clipId,
        title: script.title,
        prompt: text,
        script,
        videoUrl: '',
        thumbnailUrl: '',
        duration: script.duration_seconds,
        createdAt: new Date().toISOString(),
        style: script.style,
        parentClipId: currentClipId || undefined,
      });
      setCurrentClipId(clipId);
      setGenerationStatus({ phase: 'idle', progress: 0, message: '' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      updateMessage(assistantMsgId, { content: `ERROR: ${errorMsg}` });
      setGenerationStatus({ phase: 'error', progress: 0, message: errorMsg });
    }
  };

  const handleGenerate = async () => {
    if (!currentClipId || !currentClip?.script) return;

    setGenerationStatus({ phase: 'generating', progress: 0, message: 'ANALYZING SCRIPT...' });

    try {
      // Find the previous clip with a video to extract last frame for continuation
      let lastFrameDataUrl: string | undefined;

      // First try parent clip
      let prevVideoUrl: string | undefined;
      if (currentClip.parentClipId) {
        const parentClip = clips.find((c) => c.id === currentClip.parentClipId);
        prevVideoUrl = parentClip?.videoUrl;
      }
      // Fallback: find any clip in chat messages that has a video
      if (!prevVideoUrl) {
        for (const msg of chatMessages) {
          if (msg.clipId && msg.clipId !== currentClipId) {
            const msgClip = clips.find((c) => c.id === msg.clipId);
            if (msgClip?.videoUrl) {
              prevVideoUrl = msgClip.videoUrl;
              break;
            }
          }
        }
      }

      // Extract last frame from previous video for image-to-video continuity
      if (prevVideoUrl) {
        try {
          setGenerationStatus({ phase: 'generating', progress: 0, message: 'EXTRACTING LAST FRAME...' });
          lastFrameDataUrl = await extractLastFrame(prevVideoUrl);
          console.log('[StoryKit] Last frame extracted, using V3 image-to-video');
        } catch (err) {
          console.warn('[StoryKit] Could not extract last frame, falling back to text-to-video', err);
        }
      }

      console.log('[StoryKit] Generate video:', {
        model: lastFrameDataUrl ? 'V3 image-to-video' : 'V3 text-to-video',
        hasLastFrame: !!lastFrameDataUrl,
      });

      const result = await generateVideo(
        currentClip.script,
        (progress, message) => {
          setGenerationStatus({ phase: 'generating', progress, message });
        },
        lastFrameDataUrl
      );

      updateClip(currentClipId, {
        videoUrl: result.video_url,
      });
      if (result.credits_used) {
        addCredits(result.credits_used);
      }
      setGenerationStatus({ phase: 'complete', progress: 1, message: 'DONE' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed';
      setGenerationStatus({ phase: 'error', progress: 0, message: errorMsg });
    }
  };

  const handleContinue = () => {
    handleSend('Continue the story');
  };

  const handleEnd = () => {
    handleSend('END — Wrap up the story with a dramatic finale');
  };

  const handleScriptUpdate = (msgId: string, updatedScript: import('../services/video-generation/types').Script) => {
    updateMessage(msgId, { script: updatedScript });
    // Also update the clip's script
    if (currentClipId) {
      updateClip(currentClipId, { script: updatedScript });
    }
  };

  const handleNew = () => {
    clearChat();
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="create">
      <div className="create__actions">
        <div className="create__left-actions">
          <button className="create__switch-btn" onClick={() => onViewChange('clips')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button className="create__switch-btn" onClick={() => setShowPrompt(true)} title="View prompt">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </button>
        </div>
        {chatMessages.length > 0 && (
          <button className="create__new" onClick={handleNew}>NEW</button>
        )}
      </div>

      <div className="create__messages">
        {chatMessages.length === 0 && (
          <div className="create__empty">
            <span className="create__empty-text">DESCRIBE YOUR STORY</span>
          </div>
        )}
        {chatMessages.map((msg) => {
          const msgClip = msg.clipId ? clips.find((c) => c.id === msg.clipId) : currentClip;
          const hasScript = !!msg.script;
          const showGenerate = hasScript && msgClip && !msgClip.videoUrl && generationStatus.phase !== 'generating';
          const showGenerating = hasScript && generationStatus.phase === 'generating';

          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              onGenerate={showGenerate ? handleGenerate : undefined}
              onContinue={msgClip?.videoUrl && !isSeriesComplete ? handleContinue : undefined}
              onEnd={msgClip?.videoUrl && !isSeriesComplete ? handleEnd : undefined}
              onScriptUpdate={showGenerate ? (s) => handleScriptUpdate(msg.id, s) : undefined}
              isGenerating={showGenerating || false}
              generationProgress={generationStatus.progress}
              generationMessage={generationStatus.message}
              generationError={generationStatus.phase === 'error' ? generationStatus.message : undefined}
              videoUrl={msgClip?.videoUrl || undefined}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="create__input-bar">
        <div className="create__input-wrap">
          <textarea
            ref={inputRef}
            className="create__input"
            placeholder="Describe your story..."
            value={input}
            rows={1}
            maxLength={110}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={handleKeyDown}
            disabled={isWorking}
          />
          <button
            className="create__send"
            onClick={() => handleSend()}
            disabled={!input.trim() || isWorking}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>

      {showPrompt && (
        <div className="create__prompt-overlay" onClick={() => setShowPrompt(false)}>
          <div className="create__prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create__prompt-header">
              <span className="create__prompt-title">SCRIPT PROMPT</span>
              <button className="create__prompt-close" onClick={() => setShowPrompt(false)}>&times;</button>
            </div>
            <pre className="create__prompt-body">
              {(() => {
                const refClip = currentClip?.videoUrl
                  ? currentClip
                  : clips.find((c) => {
                      const inChat = chatMessages.some((m) => m.clipId === c.id);
                      return inChat && c.videoUrl;
                    });
                const prevScript = refClip?.script;
                let epNum = 1;
                if (refClip) {
                  let wId: string | undefined = refClip.id;
                  while (wId) {
                    epNum++;
                    const w = clips.find((c) => c.id === wId);
                    wId = w?.parentClipId;
                  }
                }
                return buildPrompt(
                  input || 'Continue the story',
                  prevScript ?? undefined,
                  prevScript ? epNum : undefined
                );
              })()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
