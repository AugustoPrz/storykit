import { useState, useRef, useEffect } from 'react';
import { useClipsStore } from '../store/clips';
import { generateScript } from '../services/storytelling/gemini';
import { generateVideo } from '../services/video-generation';
import ChatMessage from '../components/ChatMessage';
import type { ChatMessage as ChatMessageType } from '../services/video-generation/types';
import type { AppView } from '../App';
import './Create.css';

interface Props {
  onViewChange: (view: AppView) => void;
}

export default function Create({ onViewChange }: Props) {
  const [input, setInput] = useState('');
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
  const MAX_EPISODES = 3;
  // Count videos generated in this chat session
  const sessionVideoCount = chatMessages.filter((m) => {
    if (!m.script) return false;
    const clip = m.clipId ? clips.find((c) => c.id === m.clipId) : currentClip;
    return clip?.videoUrl;
  }).length + (currentClip?.videoUrl && !chatMessages.some((m) => m.clipId === currentClipId) ? 1 : 0);
  const isSeriesComplete = sessionVideoCount >= MAX_EPISODES;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, generationStatus]);

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
      // Find clips referenced in this chat session (by IDs in chat messages or current chain)
      const sessionClipIds = new Set(
        chatMessages.filter((m) => m.script).map((m) => m.clipId).filter(Boolean)
      );
      if (currentClipId) sessionClipIds.add(currentClipId);
      // Walk parent chain to include all ancestors
      let walkId = currentClip?.parentClipId;
      while (walkId) {
        sessionClipIds.add(walkId);
        const w = clips.find((c) => c.id === walkId);
        walkId = w?.parentClipId;
      }
      // Last video in this session for reference
      const lastVideoClip = clips.find((c) => sessionClipIds.has(c.id) && c.videoUrl);
      const previousScript = lastVideoClip?.script ?? currentClip?.script;
      // Count session clips with videos for episode numbering
      const videoClipCount = clips.filter((c) => sessionClipIds.has(c.id) && c.videoUrl).length;
      const episodeNumber = videoClipCount + 1;
      const script = await generateScript(
        text,
        lastVideoClip ? previousScript : undefined,
        lastVideoClip ? episodeNumber : undefined
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
      // Use the most recently generated video in this session as O3 reference
      const sessionMsgClipIds = new Set(
        chatMessages.filter((m) => m.script).map((m) => m.clipId).filter(Boolean)
      );
      if (currentClipId) sessionMsgClipIds.add(currentClipId);
      const lastVideoClip = clips.find((c) => sessionMsgClipIds.has(c.id) && c.videoUrl && c.id !== currentClipId);
      const referenceVideoUrl = lastVideoClip?.videoUrl || undefined;

      const result = await generateVideo(
        currentClip.script,
        (progress, message) => {
          setGenerationStatus({ phase: 'generating', progress, message });
        },
        referenceVideoUrl
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
        <button className="create__switch-btn" onClick={() => onViewChange('clips')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
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
    </div>
  );
}
