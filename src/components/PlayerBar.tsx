import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAY_COUNT_THRESHOLD_SECONDS } from '../player/constants';
import type { RepeatMode, Song } from '../types';

interface PlayerBarProps {
  currentSong: Song | null;
  queue: Song[];
  removeFromQueue: (index: number) => void;
  playNext: () => boolean;
  playPrev: () => boolean;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  isShuffle: boolean;
  setIsShuffle: (val: boolean) => void;
  playToken: number;
  onSongPlayed: (id: string) => void;
  t: any;
  theme: any;
}

export const PlayerBar = ({ 
  currentSong, queue, removeFromQueue, playNext, playPrev, reorderQueue,
  repeatMode, setRepeatMode, isShuffle, setIsShuffle, playToken, onSongPlayed, t, theme
}: PlayerBarProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);

  const queueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showQueue && queueRef.current && !queueRef.current.contains(event.target as Node)) {
        setShowQueue(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showQueue]);

  /** برای هر پخش فقط یک بار playCount زیاد بشه */
  const countedRef = useRef(false);
  const songUrl = currentSong?.fileUrl ?? null;

  // بارگذاری و پخش آهنگ. وابسته به آدرس فایل و playToken است (نه کل آبجکت آهنگ):
  // ویرایش اطلاعات آهنگ، پخش را از اول شروع نمی‌کند، ولی انتخاب مجدد همان آهنگ ریستارتش می‌کند.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    countedRef.current = false;

    if (!songUrl) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    audio.src = songUrl;
    audio.play().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return; // با آهنگ دیگری جایگزین شد
      console.error(err);
    });
  }, [songUrl, playToken]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);

    if (currentSong && !countedRef.current) {
      const threshold = Math.min(PLAY_COUNT_THRESHOLD_SECONDS, (audio.duration || Infinity) / 2);
      if (audio.currentTime >= threshold) {
        countedRef.current = true;
        onSongPlayed(currentSong.id);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (audio.paused) audio.play().catch(console.error);
    else audio.pause();
  };

  const toggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  };

  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        countedRef.current = false; // هر دور تکرار یک پخش حساب می‌شود
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      return;
    }
    // آخر لیست و تکرار خاموش: آهنگ بعدی وجود ندارد و پخش متوقف می‌ماند
    if (!playNext()) setIsPlaying(false);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  // # رنگ‌های ثابت برای متن‌های اصلی (مستقل از پالت)
  const songTitleColor = '#ffffff';
  const artistColor = '#dbdbdb';
  const iconColor = '#e0e0e0';
  const iconActiveColor = theme.colors.primary;
  const iconInactiveColor = '#a1a1a6';

  // # درخشش نوار پیشرفت (بر اساس پالت)
  const glowColor = `0 0 12px ${theme.colors.primary}`;

  const btnStyle = { background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 };

  return (
    <div style={{ 
      height: '80px', 
      width: '90%',
      maxWidth: '1000px',
      // # پس‌زمینه شیشه‌ای تیره (ثابت برای همه پالت‌ها، تا متن‌های سفید خوانا باشند)
      backgroundColor: 'rgba(20, 20, 22, 0.50)', 
      backdropFilter: 'blur(30px)', 
      WebkitBackdropFilter: 'blur(30px)',
      borderRadius: '20px',
      margin: '0 auto 24px auto',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 24px', 
      position: 'relative', 
      color: '#ffffff', 
      zIndex: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', 
      border: '1px solid rgba(255, 255, 255, 0.1)' 
    }}>
      
      {/* # باکس صف */}
      <AnimatePresence>
        {showQueue && (
          <div style={{ position: 'absolute', bottom: '90px', right: '24px', zIndex: 50 }} ref={queueRef}>
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ 
                width: '350px', maxHeight: '400px', 
                backgroundColor: 'rgba(30, 30, 32, 0.95)', 
                backdropFilter: 'blur(20px)', 
                borderRadius: theme.radius.lg, 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '20px', overflowY: 'auto', 
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{t.queue}</h3>
                <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowQueue(false)} style={{ background: 'none', border: 'none', color: '#a1a1a6', cursor: 'pointer', fontSize: '16px' }}>✕</motion.button>
              </div>
              {queue.length === 0 ? (
                <p style={{ color: '#a1a1a6', fontSize: '13px' }}>{t.queueEmpty}</p>
              ) : (
                queue.map((song, index) => (
                  <div 
                    key={song.id + index} draggable 
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())} 
                    onDragOver={(e) => e.preventDefault()} 
                    onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain'), 10); if (!Number.isNaN(from)) reorderQueue(from, index); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', padding: '8px', borderRadius: theme.radius.md, cursor: 'grab', backgroundColor: 'rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  >
                    <img src={song.cover} alt="" style={{ width: '40px', height: '40px', borderRadius: theme.radius.sm, pointerEvents: 'none' }} />
                    <div style={{ flex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff' }}>{song.name}</div>
                      <div style={{ fontSize: '12px', color: '#a1a1a6' }}>{song.artist}</div>
                    </div>
                    <button onClick={() => removeFromQueue(index)} style={{ background: 'none', border: 'none', color: '#a1a1a6', cursor: 'pointer', pointerEvents: 'auto', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = theme.colors.danger; e.currentTarget.style.transform = 'scale(1.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#a1a1a6'; e.currentTarget.style.transform = 'scale(1)'; }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '220px' }}>
        {currentSong ? (
          <>
            <img src={currentSong.cover} alt="" style={{ width: '48px', height: '48px', borderRadius: theme.radius.sm, objectFit: 'cover', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: songTitleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.name}</div>
              <div style={{ color: artistColor, fontSize: '12px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.artist}</div>
            </div>
          </>
        ) : (
          <div style={{ color: artistColor, fontSize: '14px' }}>{t.noSongSelected || '---'}</div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '600px', marginTop: '5px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', marginBottom: '8px' }} onMouseEnter={() => setIsHoveringProgress(true)} onMouseLeave={() => setIsHoveringProgress(false)}>
          <span style={{ fontSize: '10px', color: artistColor, width: '30px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatTime(currentTime)}</span>
          <div style={{ flex: 1, position: 'relative', height: '16px', display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              position: 'absolute', left: 0, right: 0, 
              height: isHoveringProgress ? '6px' : '3px', 
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '3px', 
              transition: 'height 0.2s ease' 
            }}>
              <div style={{ 
                width: `${progressPercent}%`, height: '100%', 
                backgroundColor: theme.colors.primary, borderRadius: '3px',
                boxShadow: glowColor 
              }}></div>
            </div>
            <input type="range" min={0} max={duration || 0} value={currentTime} onChange={(e) => { if(audioRef.current) audioRef.current.currentTime = Number(e.target.value); setCurrentTime(Number(e.target.value)); }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }} />
          </div>
          <span style={{ fontSize: '10px', color: artistColor, width: '30px', fontVariantNumeric: 'tabular-nums' }}>{formatTime(duration)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={() => setIsShuffle(!isShuffle)} style={{ ...btnStyle, color: isShuffle ? iconActiveColor : iconInactiveColor, transition: 'all 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"/><path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192"/></svg>
          </button>
          
          <button onClick={playPrev} style={{ ...btnStyle, color: iconColor, transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z"/><path d="M.404 7.304a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696z"/></svg>
          </button>
          
          <button onClick={togglePlay} style={{ ...btnStyle, width: '32px', height: '32px', color: '#ffffff', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {isPlaying ? <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/></svg> : <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: '3px' }}><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>}
          </button>
          
          <button onClick={playNext} style={{ ...btnStyle, color: iconColor, transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696z"/><path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696z"/></svg>
          </button>
          
          <button onClick={toggleRepeat} style={{ ...btnStyle, color: repeatMode !== 'off' ? iconActiveColor : iconInactiveColor, transition: 'all 0.2s' }}>
            {repeatMode === 'one' ? <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z"/><path d="M9 5.5a.5.5 0 0 0-.854-.354l-1.75 1.75a.5.5 0 1 0 .708.708L8 6.707V10.5a.5.5 0 0 0 1 0z"/></svg> : <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/></svg>}
          </button>
        </div>
      </div>

      <div style={{ width: '220px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '30px' }} onMouseEnter={() => setIsHoveringVolume(true)} onMouseLeave={() => setIsHoveringVolume(false)}>
          <button style={{ ...btnStyle, color: isHoveringVolume ? '#ffffff' : iconInactiveColor }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <div style={{ 
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', 
            height: isHoveringVolume ? '100px' : '0px', width: '40px', opacity: isHoveringVolume ? 1 : 0, 
            overflow: 'hidden', transition: 'all 0.3s ease', 
            backgroundColor: 'rgba(30, 30, 32, 0.95)', backdropFilter: 'blur(10px)',
            borderRadius: theme.radius.lg, border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: isHoveringVolume ? '10px 0' : '0', marginBottom: '10px', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <div style={{ position: 'relative', width: '20px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: '4px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2px', left: '8px' }}></div>
              <div style={{ position: 'absolute', bottom: 0, height: `${volumePercent}%`, width: '4px', backgroundColor: theme.colors.primary, borderRadius: '2px', left: '8px' }}></div>
              <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolumeChange} style={{ position: 'absolute', width: '80px', height: '20px', transform: 'rotate(-90deg)', opacity: 0, cursor: 'pointer', zIndex: 2, left: '-30px', top: '30px' }} />
            </div>
          </div>
        </div>
        <button onClick={() => setShowQueue(!showQueue)} style={{ ...btnStyle, color: showQueue ? iconActiveColor : iconInactiveColor, gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>{t.queue}</span>
        </button>
      </div>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleSongEnd} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
    </div>
  );
};