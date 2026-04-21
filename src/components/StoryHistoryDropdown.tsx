import { useEffect, useState } from 'react';
import { fetchUserStories } from '../services/clips/supabase-clips';
import type { ClipMetadata } from '../services/video-generation/types';
import './StoryHistoryDropdown.css';

interface Props {
  userId: string;
  onSelectStory: (rootClipId: string) => void;
  onClose: () => void;
}

export default function StoryHistoryDropdown({ userId, onSelectStory, onClose }: Props) {
  const [stories, setStories] = useState<ClipMetadata[] | null>(null);

  useEffect(() => {
    fetchUserStories(userId).then(setStories);
  }, [userId]);

  return (
    <div className="story-history-overlay" onClick={onClose}>
      <div className="story-history" onClick={(e) => e.stopPropagation()}>
        <div className="story-history__header">
          <span className="story-history__title">YOUR STORIES</span>
          <button className="story-history__close" onClick={onClose}>&times;</button>
        </div>
        <div className="story-history__list">
          {stories === null ? (
            <div className="story-history__empty">LOADING...</div>
          ) : stories.length === 0 ? (
            <div className="story-history__empty">NO PAST STORIES YET</div>
          ) : (
            stories.map((story) => {
              const date = new Date(story.createdAt);
              return (
                <button
                  key={story.id}
                  className="story-history__item"
                  onClick={() => {
                    onSelectStory(story.id);
                    onClose();
                  }}
                >
                  <span className="story-history__item-title">{story.title || 'Untitled'}</span>
                  <span className="story-history__item-date">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
