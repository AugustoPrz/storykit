import type { ChatMessage as ChatMessageType } from '../services/video-generation/types';
import ScriptCard from './ScriptCard';
import './ChatMessage.css';

interface Props {
  message: ChatMessageType;
  onGenerate?: () => void;
  onContinue?: () => void;
  isGenerating?: boolean;
  generationProgress?: number;
  generationMessage?: string;
  generationError?: string;
  videoUrl?: string;
}

export default function ChatMessage({
  message,
  onGenerate,
  onContinue,
  isGenerating,
  generationProgress,
  generationMessage,
  generationError,
  videoUrl,
}: Props) {
  if (message.role === 'system') {
    return (
      <div className="chat-msg chat-msg--system">
        <span className="chat-msg__text">{message.content}</span>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="chat-msg chat-msg--user">
        <div className="chat-msg__bubble chat-msg__bubble--user">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-msg chat-msg--assistant">
      {message.content && !message.script && (
        <div className="chat-msg__bubble chat-msg__bubble--assistant">
          {message.content}
        </div>
      )}
      {message.script && (
        <ScriptCard
          script={message.script}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          generationMessage={generationMessage}
          generationError={generationError}
          videoUrl={videoUrl}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}
