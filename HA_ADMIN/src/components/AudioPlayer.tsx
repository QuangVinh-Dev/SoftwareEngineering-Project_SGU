import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Pause, Play, Volume2 } from 'lucide-react';
import { getAccessToken } from '@/services/authApi';

interface AudioPlayerProps {
  src: string;
  title: string;
  className?: string;
}

/**
 * Backend bảo vệ /uploads/audio/** bằng ROLE_ADMIN / SERVICE_ACCESS.
 * Thẻ <audio src> không gửi được header Authorization, nên phải tải file
 * bằng fetch kèm Bearer token rồi phát qua blob URL.
 */
export default function AudioPlayer({ src, title, className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let createdUrl = '';

    setObjectUrl('');
    setFetching(false);
    setPlaying(false);
    setLoading(false);
    setCurrentTime(0);
    setDuration(0);
    setError('');
    audioRef.current?.pause();

    if (src) {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      setFetching(true);
      fetch(src, { headers, credentials: 'omit', cache: 'no-store' })
        .then(async response => {
          if (!response.ok) throw new AudioRequestError(response.status);
          const blob = await response.blob();
          if (blob.size === 0) throw new AudioRequestError(0);
          if (cancelled) return;
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        })
        .catch((cause: unknown) => {
          if (!cancelled) setError(describeFailure(cause));
        })
        .finally(() => {
          if (!cancelled) setFetching(false);
        });
    }

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      audioRef.current?.pause();
    };
  }, [src]);

  const playOrPause = async () => {
    const audio = audioRef.current;
    if (!audio || !objectUrl) return;
    setError('');
    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      // Called only from a user click so browser autoplay policy is respected.
      await audio.play();
      setPlaying(true);
    } catch (playError) {
      setPlaying(false);
      setLoading(false);
      const name = playError instanceof DOMException ? playError.name : '';
      setError(name === 'NotAllowedError'
        ? 'Trình duyệt chặn phát audio. Hãy bấm Play lại sau tương tác của bạn.'
        : 'Không phát được audio. File có thể hỏng hoặc codec không được trình duyệt hỗ trợ.');
    }
  };

  const busy = fetching || loading;

  return (
    <div className={`rounded-lg border border-brown-100 bg-white p-3 ${className}`}>
      <audio
        ref={audioRef}
        src={objectUrl || undefined}
        preload="auto"
        onLoadedMetadata={event => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value)) setDuration(value);
        }}
        onCanPlay={event => {
          setLoading(false);
          const value = event.currentTarget.duration;
          if (Number.isFinite(value)) setDuration(value);
        }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setLoading(false); setPlaying(true); }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
        onError={() => {
          setPlaying(false);
          setLoading(false);
          setError('Không giải mã được audio. File có thể hỏng hoặc codec không được trình duyệt hỗ trợ.');
        }}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void playOrPause()}
          disabled={fetching || (loading && !playing)}
          aria-label={playing ? `Tạm dừng ${title}` : `Phát ${title}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs text-brown-600">
            <span className="flex min-w-0 items-center gap-1 truncate"><Volume2 className="h-3.5 w-3.5 shrink-0" />{title}</span>
            <span className="shrink-0 tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            disabled={!duration}
            aria-label={`Tiến trình ${title}`}
            onChange={event => {
              const next = Number(event.target.value);
              if (audioRef.current) audioRef.current.currentTime = next;
              setCurrentTime(next);
            }}
            className="h-1.5 w-full cursor-pointer accent-primary-600 disabled:cursor-default"
          />
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      {!error && (
        <p aria-live="polite" className="mt-1 text-[11px] text-brown-400">
          {fetching ? 'Đang tải audio…' : playing ? 'Đang phát' : 'Sẵn sàng phát'}
        </p>
      )}
    </div>
  );
}

class AudioRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Audio request failed (HTTP ${status})`);
    this.name = 'AudioRequestError';
  }
}

function describeFailure(cause: unknown) {
  if (cause instanceof AudioRequestError) {
    if (cause.status === 0) return 'File audio trên máy chủ có dung lượng bằng 0.';
    if (cause.status === 401 || cause.status === 403) {
      return `Máy chủ từ chối quyền tải audio (HTTP ${cause.status}). Phiên đăng nhập có thể đã hết hạn — hãy đăng nhập lại.`;
    }
    if (cause.status === 404) return 'Không tìm thấy file audio trên máy chủ (HTTP 404).';
    return `Máy chủ không thể tải file audio (HTTP ${cause.status}).`;
  }
  return 'Không kết nối được máy chủ để tải audio. Kiểm tra backend đang chạy và VITE_API_BASE_URL.';
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
