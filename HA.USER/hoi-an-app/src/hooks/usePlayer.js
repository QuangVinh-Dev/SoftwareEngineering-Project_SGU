import { useCallback, useEffect, useRef, useState } from 'react';

const LANG_LABEL = { VI: 'Tiếng Việt', EN: 'English', ZH: '中文', JA: '日本語', KO: '한국어' };
const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

export function usePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [title, setTitle] = useState('—');
  const [meta, setMeta] = useState('');
  const audioRef = useRef(null);

  const openPlayer = useCallback((name, langCode, _poiId, audioUrl, options = {}) => {
    const language = String(langCode || 'VI').toUpperCase();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setTitle(name || '—');
    setIsOpen(true);
    setIsPlaying(false);
    setIsLoading(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(Number(options.durationSeconds) || 0);

    if (options.empty) {
      setMeta(`${LANG_LABEL[language] || language} · Không có audio cho địa điểm này`);
      return;
    }
    if (options.error) {
      setMeta(`${LANG_LABEL[language] || language} · Không tải được audio`);
      return;
    }
    if (!audioUrl) {
      setMeta(`${LANG_LABEL[language] || language} · Audio không hợp lệ`);
      return;
    }

    const player = audio || new Audio();
    audioRef.current = player;
    player.onloadedmetadata = () => {
      if (Number.isFinite(player.duration)) setDuration(player.duration);
      setIsLoading(false);
    };
    player.ontimeupdate = () => {
      setCurrentTime(player.currentTime || 0);
      setProgress(player.duration ? (player.currentTime / player.duration) * 100 : 0);
    };
    player.onended = () => { setIsPlaying(false); setProgress(100); };
    player.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setMeta(`${LANG_LABEL[language] || language} · Lỗi tải hoặc định dạng audio không hỗ trợ`);
    };
    player.src = audioUrl;
    player.load();
    setMeta([options.languageName || LANG_LABEL[language] || language, options.voiceName].filter(Boolean).join(' · '));
    setIsLoading(true);
    player.play().then(() => setIsPlaying(true)).catch((error) => {
      setIsPlaying(false);
      setIsLoading(false);
      if (error?.name === 'NotAllowedError') {
        setMeta(`${options.languageName || LANG_LABEL[language] || language} · Nhấn Phát để bắt đầu`);
      } else {
        setMeta(`${options.languageName || LANG_LABEL[language] || language} · Không thể phát audio`);
      }
    });
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;
    if (audio.paused) {
      setIsLoading(true);
      audio.play().then(() => { setIsPlaying(true); setIsLoading(false); }).catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
        setMeta((value) => `${value.split(' · ')[0]} · Không thể phát audio`);
      });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((percent) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(100, percent)) / 100 * audio.duration;
  }, []);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    setIsOpen(false);
    setIsPlaying(false);
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return {
    isOpen, isPlaying, isLoading, progress,
    timeText: `${formatTime(currentTime)} / ${formatTime(duration)}`,
    title, meta, openPlayer, closePlayer, togglePlay, seek,
  };
}
