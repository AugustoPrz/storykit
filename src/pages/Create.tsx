import { useState, useRef, useEffect } from 'react';
import { useClipsStore } from '../store/clips';
import { generateScript } from '../services/storytelling/gemini';
import { generateVideo } from '../services/video-generation';
import ChatMessage from '../components/ChatMessage';
import type { ChatMessage as ChatMessageType } from '../services/video-generation/types';
import './Create.css';

export default function Create() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, generationStatus]);

  const handleSend = async () => {
    const text = input.trim();
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
      const previousScript = currentClip?.script;
      // Count episode chain length for title numbering
      let episodeNumber = 1;
      if (currentClip?.parentClipId || currentClip?.videoUrl) {
        let walkerId: string | undefined = currentClip?.id;
        while (walkerId) {
          episodeNumber++;
          const w = clips.find((c) => c.id === walkerId);
          walkerId = w?.parentClipId;
        }
      }
      const script = await generateScript(
        text,
        previousScript,
        previousScript ? episodeNumber : undefined
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
      // If this is a continuation clip, pass parent's video URL for O3 reference
      const parentClip = currentClip.parentClipId
        ? clips.find((c) => c.id === currentClip.parentClipId)
        : undefined;
      const referenceVideoUrl = parentClip?.videoUrl || undefined;

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
    setInput('Continue the story');
    inputRef.current?.focus();
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
              onContinue={msgClip?.videoUrl ? handleContinue : undefined}
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
        <input
          ref={inputRef}
          className="create__input"
          type="text"
          placeholder="Describe your story..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isWorking}
        />
        <button
          className="create__send"
          onClick={handleSend}
          disabled={!input.trim() || isWorking}
        >
          GO
        </button>
      </div>
    </div>
  );
}
