import { useRef, useState } from 'react';
import { MAX_HISTORY } from '../player/constants';
import { nextInOrder, pickNextShuffled, prevInOrder } from '../player/navigation';
import type { RepeatMode, Song } from '../types/index';
import { moveItem } from '../utils/array';

/**
 * حالت و منطق پخش: آهنگ فعلی، صف، شافل، تکرار و جابه‌جایی بعدی/قبلی.
 * خود عنصر <audio> در PlayerBar می‌مونه؛ این هوک فقط تصمیم می‌گیره «چی پخش بشه».
 *
 * @param songs کل کتابخانه (وقتی صف خالیه، از اینجا پخش می‌شه)
 */
export const usePlayer = (songs: readonly Song[]) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffleState] = useState(false);
  /** با هر شروع پخش یکی زیاد می‌شه تا حتی پخش مجدد همون آهنگ هم از اول شروع بشه */
  const [playToken, setPlayToken] = useState(0);

  /** آهنگ‌های پخش‌شده در دور فعلی شافل */
  const playedIds = useRef<Set<string>>(new Set());
  /** تاریخچه‌ی پخش برای دکمه‌ی «قبلی» در حالت شافل */
  const history = useRef<string[]>([]);

  const baseList: readonly Song[] = queue.length > 0 ? queue : songs;

  const remember = (nextId: string) => {
    if (!currentSong || currentSong.id === nextId) return;
    history.current.push(currentSong.id);
    if (history.current.length > MAX_HISTORY) history.current.shift();
  };

  const start = (song: Song) => {
    setCurrentSong(song);
    setPlayToken((token) => token + 1);
  };

  /** پخش یک آهنگ از یک لیست (لیست می‌شه صف پخش) */
  const playSongFromList = (song: Song, list: Song[]) => {
    remember(song.id);
    setQueue(list);
    playedIds.current = new Set([song.id]);
    start(song);
  };

  /** رفتن به آهنگ بعدی. اگه آهنگ بعدی‌ای نباشه false برمی‌گردونه */
  const playNext = (): boolean => {
    const currentId = currentSong?.id ?? null;
    const loop = repeatMode === 'all';
    let target: Song | null;

    if (isShuffle) {
      const pick = pickNextShuffled(baseList, currentId, playedIds.current, loop);
      playedIds.current = pick.played;
      target = pick.song;
    } else {
      target = nextInOrder(baseList, currentId, loop);
    }

    if (!target) return false;
    remember(target.id);
    start(target);
    return true;
  };

  /** رفتن به آهنگ قبلی (در شافل: آخرین آهنگی که واقعاً گوش داده شده). اگه نباشه false */
  const playPrev = (): boolean => {
    let target: Song | null = null;

    if (isShuffle) {
      while (history.current.length > 0 && !target) {
        const id = history.current.pop();
        const found = baseList.find((song) => song.id === id);
        if (found && found.id !== currentSong?.id) target = found;
      }
    } else {
      target = prevInOrder(baseList, currentSong?.id ?? null, repeatMode === 'all');
    }

    if (!target) return false;
    start(target);
    return true;
  };

  const setShuffle = (value: boolean) => {
    setIsShuffleState(value);
    playedIds.current = new Set(currentSong ? [currentSong.id] : []);
  };

  const addToQueue = (song: Song) => setQueue((prev) => [...prev, song]);

  /** حذف با اندیس (نه id) تا اگه یه آهنگ دو بار توی صف بود، فقط همون یکی حذف بشه */
  const removeFromQueueAt = (index: number) => setQueue((prev) => prev.filter((_, i) => i !== index));

  const reorderQueue = (fromIndex: number, toIndex: number) =>
    setQueue((prev) => moveItem(prev, fromIndex, toIndex));

  /** وقتی اطلاعات یه آهنگ ویرایش شد، نسخه‌ی داخل صف و پلیر رو هم به‌روز کن */
  const syncSong = (updated: Song) => {
    setQueue((prev) => prev.map((song) => (song.id === updated.id ? updated : song)));
    setCurrentSong((current) => (current?.id === updated.id ? updated : current));
  };

  /** وقتی آهنگی از کتابخانه حذف شد: از صف در بیار و اگه در حال پخش بود، پلیر رو خالی کن */
  const removeSong = (id: string) => {
    setQueue((prev) => prev.filter((song) => song.id !== id));
    setCurrentSong((current) => (current?.id === id ? null : current));
  };

  return {
    currentSong,
    queue,
    repeatMode,
    isShuffle,
    playToken,
    setRepeatMode,
    setShuffle,
    playSongFromList,
    playNext,
    playPrev,
    addToQueue,
    removeFromQueueAt,
    reorderQueue,
    syncSong,
    removeSong,
  };
};
