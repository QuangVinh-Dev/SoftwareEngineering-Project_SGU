import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Pause, Play, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title: string;
  className?: string;
}

export default function AudioPlayer({ src, title, className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const audio = audioRef.current;
    setPlaying(false);
    setLoading(false);
    setCurrentTime(0);
    setDuration(0);
    setError('');
    audio?.pause();
    if (audio) audio.load();
    return () => audio?.pause();
  }, [src]);

  const playOrPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
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
        : await describeAudioError(src));
    }
  };

  const onAudioError = async () => {
    setPlaying(false);
    setLoading(false);
    setError(await describeAudioError(src));
  };

  return (
    <div className={`rounded-lg border border-brown-100 bg-white p-3 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
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
        onError={() => { void onAudioError(); }}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void playOrPause()}
          disabled={loading && !playing}
          aria-label={playing ? `Tạm dừng ${title}` : `Phát ${title}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
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
      {!error && <p aria-live="polite" className="mt-1 text-[11px] text-brown-400">{loading ? 'Đang tải audio…' : playing ? 'Đang phát' : 'Sẵn sàng phát'}</p>}
    </div>
  );
}

async function describeAudioError(src: string) {
  try {
    const response = await fetch(src, { method: 'HEAD', mode: 'cors', credentials: 'omit' });
    if (response.status === 404) return 'Không tìm thấy file audio trên máy chủ (HTTP 404).';
    if (!response.ok) return `Máy chủ không thể tải file audio (HTTP ${response.status}).`;
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('audio/')) return `URL audio trả về ${contentType || 'không có Content-Type audio'}, không phải dữ liệu âm thanh.`;
    const length = response.headers.get('content-length');
    if (length === '0') return 'File audio trên máy chủ có dung lượng bằng 0.';
  } catch {
    return 'Không kết nối được URL audio; kiểm tra mạng và CORS của máy chủ.';
  }
  return 'Không giải mã được audio. File có thể hỏng hoặc codec không được trình duyệt hỗ trợ.';
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
