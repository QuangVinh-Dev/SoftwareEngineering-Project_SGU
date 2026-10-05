// src/hooks/usePlayer.js
import { useState, useEffect, useRef, useCallback } from 'react';

const SPEECH_LANG = {
  VI: 'vi-VN', EN: 'en-US', ZH: 'zh-CN', JA: 'ja-JP', KO: 'ko-KR',
};

const LANG_LABEL = {
  VI: 'Tiếng Việt', EN: 'English', ZH: '中文', JA: '日本語', KO: '한국어',
};

const CHARS_PER_SECOND = {
  VI: 14, EN: 16, ZH: 5, JA: 6, KO: 12,
};

const COOLDOWN_MS = 3000;
const DEBOUNCE_MS = 500;
const QUEUE_MAX = 3;

export function usePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [title, setTitle] = useState('—');
  const [meta, setMeta] = useState('Tiếng Việt');
  const [text, setText] = useState('');
  const [lang, setLang] = useState('VI');
  const [queueLength, setQueueLength] = useState(0);

  const utteranceRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const rafRef = useRef(null);
  const estimatedDurationRef = useRef(0);
  const isPausedRef = useRef(false);

  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);

  const lastPlayAtRef = useRef(0);
  const cooldownUntilRef = useRef(0);

  const fmt = (s) => {
    if (!s || isNaN(s) || s < 0) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const timeText = `${fmt(currentTime)} / ${fmt(duration)}`;

  /* ---------- Tick bằng requestAnimationFrame ---------- */
  const startTick = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = () => {
      if (isPausedRef.current || !utteranceRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const pct = Math.min(100, (elapsed / estimatedDurationRef.current) * 100);
      setProgress(pct);
      setCurrentTime(Math.min(elapsed, estimatedDurationRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTick = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* ---------- Phát 1 utterance ---------- */
  const playUtterance = useCallback(({ name, langCode, poiId, speechText }) => {
    const langKey = (langCode || 'VI').toUpperCase();
    const speechLang = SPEECH_LANG[langKey] || 'vi-VN';
    const langLabel = LANG_LABEL[langKey] || 'Tiếng Việt';

    const speakText = (speechText || name || '').trim();
    if (!speakText) return;

    setTitle(name || '—');
    setMeta(langLabel);
    setText(speakText);
    setLang(langKey);

    const cps = CHARS_PER_SECOND[langKey] || 12;
    const est = Math.max(2, speakText.length / cps);
    estimatedDurationRef.current = est;
    setDuration(est);
    setProgress(0);
    setCurrentTime(0);

    window.speechSynthesis.cancel();

    if (!('speechSynthesis' in window)) {
      console.warn('[Player] Browser không hỗ trợ Web Speech API');
      setMeta(langLabel + ' · Không hỗ trợ');
      setIsOpen(true);
      setIsPlaying(false);
      return;
    }

    const utt = new SpeechSynthesisUtterance(speakText);
    utt.lang = speechLang;
    utt.rate = 1;
    utt.pitch = 1;
    utt.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const matched =
      voices.find((v) => v.lang === speechLang) ||
      voices.find((v) => v.lang.startsWith(speechLang.split('-')[0]));
    if (matched) utt.voice = matched;

    utt.onstart = () => {
      setIsPlaying(true);
      startTimeRef.current = Date.now();
      pausedAtRef.current = 0;
      isPausedRef.current = false;
      startTick();
    };

    utt.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      setCurrentTime(estimatedDurationRef.current);
      stopTick();

      cooldownUntilRef.current = Date.now() + COOLDOWN_MS;

      isProcessingRef.current = false;
      processQueueRef.current?.();
    };

    utt.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('[Player] TTS error:', e.error);
      setIsPlaying(false);
      stopTick();
      isProcessingRef.current = false;
      processQueueRef.current?.();
    };

    utteranceRef.current = utt;
    setIsOpen(true);
    setIsPlaying(true);

    /* Delay nhỏ để tránh block thread */
    setTimeout(() => {
      window.speechSynthesis.speak(utt);
    }, 30);
  }, [startTick, stopTick]);

  const processQueueRef = useRef(null);

  const processQueue = useCallback(() => {
    if (isProcessingRef.current) return;
    if (queueRef.current.length === 0) return;

    isProcessingRef.current = true;
    const next = queueRef.current.shift();
    setQueueLength(queueRef.current.length);
    playUtterance(next);
  }, [playUtterance]);

  processQueueRef.current = processQueue;

  /* ---------- Open ---------- */
  const openPlayer = useCallback(
    (name, langCode, poiId, speechText, options = {}) => {
      const { priority = 'normal', force = false } = options;
      const now = Date.now();

      if (!force && now - lastPlayAtRef.current < DEBOUNCE_MS) return;
      if (!force && now < cooldownUntilRef.current) return;

      lastPlayAtRef.current = now;
      const item = { name, langCode, poiId, speechText, priority };

      if (window.speechSynthesis.speaking) {
        if (priority === 'high') queueRef.current.unshift(item);
        else queueRef.current.push(item);

        if (queueRef.current.length > QUEUE_MAX) {
          queueRef.current = queueRef.current.slice(-QUEUE_MAX);
        }
        setQueueLength(queueRef.current.length);
        return;
      }

      playUtterance(item);
    },
    [playUtterance]
  );

  /* ---------- Close ---------- */
  const closePlayer = useCallback(() => {
    window.speechSynthesis.cancel();
    stopTick();
    utteranceRef.current = null;
    queueRef.current = [];
    isProcessingRef.current = false;
    setQueueLength(0);
    setIsOpen(false);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, [stopTick]);

  /* ---------- Toggle play/pause ---------- */
  const togglePlay = useCallback(() => {
    if (!utteranceRef.current) return;
    const synth = window.speechSynthesis;

    if (isPlaying) {
      synth.pause();
      pausedAtRef.current = Date.now();
      isPausedRef.current = true;
      stopTick();
      setIsPlaying(false);
    } else {
      if (synth.paused) {
        synth.resume();
        if (pausedAtRef.current) {
          startTimeRef.current += Date.now() - pausedAtRef.current;
          pausedAtRef.current = 0;
        }
        isPausedRef.current = false;
        startTick();
        setIsPlaying(true);
      } else {
        openPlayer(title, lang, null, text, { force: true });
      }
    }
  }, [isPlaying, title, lang, text, openPlayer, startTick, stopTick]);

  const seek = useCallback(() => {}, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      window.speechSynthesis.cancel();
      stopTick();
    };
  }, [stopTick]);

  return {
    isOpen, isPlaying, progress, timeText, title, meta, lang, text, queueLength,
    openPlayer, closePlayer, togglePlay, seek,
  };
}
