import { useEffect, useState } from 'react';

export function useCommentMode(): [boolean, (enabled: boolean) => void] {
  const [commentModeEnabled, setCommentModeEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lexical-comment-mode-enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Persist comment mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lexical-comment-mode-enabled', String(commentModeEnabled));
    }
  }, [commentModeEnabled]);

  return [commentModeEnabled, setCommentModeEnabled];
}
