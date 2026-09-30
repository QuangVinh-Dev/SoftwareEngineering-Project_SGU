import { useState, useEffect, useRef, useCallback } from 'react';

const TOTAL = 154;

export function usePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('—');
  const [meta, setMeta] = useState('Tiếng Việt · 02:34');
  const tickRef = useRef(null);

  const fmt = (s) => String(Math.floor(s/60)).padStart(2,'0') + ':' + String(Math.floor(s%60)).padStart(2,'0');

  const timeText = `${fmt(progress/100*TOTAL)} / ${fmt(TOTAL)}`;

  useEffect(() => {
    if (isPlaying) {
      tickRef.current = setInterval(() => {
        setProgress(prev => {
          const next = prev + .18;
          if (next >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(tickRef.current);
  }, [isPlaying]);

  const openPlayer = useCallback((name, langCode) => {
    setTitle(name);
    if (langCode) {
      const m = {'VI':'Tiếng Việt · 02:34','EN':'English · 02:41','ZH':'中文 · 02:28','JA':'日本語 · 02:52','KO':'한국어 · 02:45'};
      setMeta(m[langCode] || '');
    }
    setProgress(0);
    setIsOpen(true);
    setIsPlaying(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsOpen(false);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);

  const seek = useCallback((percent) => {
    setProgress(Math.max(0, Math.min(100, percent)));
  }, []);

  return { isOpen, isPlaying, progress, timeText, title, meta, openPlayer, closePlayer, togglePlay, seek };
}