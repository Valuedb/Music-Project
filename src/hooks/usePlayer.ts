import { useCallback, useRef, useState } from 'react';
import { MAX_HISTORY } from '../player/constants';
import { nextInOrder, pickNextShuffled, prevInOrder } from '../player/navigation';
import type { RepeatMode, Song } from '../types/index';
import { moveItem } from '../utils/array';
import { usePersistentState } from './usePersistentState';
import { STORAGE_KEYS } from '../storage/keys';

/**
 * حالت و منطق پخش: آهنگ فعلی، صف، شافل، تکرار و جابه‌جایی بعدی/قبلی.
 * خود عنصر <audio> در PlayerBar می‌مونه؛ این هوک فقط تصمیم می‌گیره «چی پخش بشه».
 *
 * @param songs کل کتابخانه (وقتی صف خالیه، از اینجا پخش می‌شه)
 */
export const usePlayer = (songs: readonly Song[]) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [repeatMode, setRepeatMode] = usePersistentState<RepeatMode>(
    STORAGE_KEYS.repeatMode,
    'off',
    (v): v is RepeatMode => v === 'off' || v === 'all' || v === 'one'
  );
  const [isShuffle, setIsShuffleState] = usePersistentState<boolean>(
    STORAGE_KEYS.shuffle,
    false,
    (v): v is boolean => typeof v === 'boolean'
  );
  /** با هر شروع پخش یکی زیاد می‌شه تا حتی پخش مجدد همون آهنگ هم از اول شروع بشه */
  const [playToken, setPlayToken] = useState(0);

  /** آهنگ‌های پخش‌شده در دور فعلی شافل */
  const playedIds = useRef<Set<string>>(new Set());
  /** تاریخچه‌ی پخش برای دکمه‌ی «قبلی» در حالت شافل */
  const history = useRef<string[]>([]);

  const baseList: readonly Song[] = queue.length > 0 ? queue : songs;

  const remember = useCallback(
    (nextId: string) => {
      if (!currentSong || currentSong.id === nextId) return;
      history.current.push(currentSong.id);
      if (history.current.length > MAX_HISTORY) history.current.shift();
    },
    [currentSong]
  );

  const start = useCallback((song: Song) => {
    setCurrentSong(song);
    setPlayToken((token) => token + 1);
  }, []);

  /** بازیابی آخرین آهنگ پخش‌شده هنگام باز کردن مجدد برنامه بدون پخش خودکار */
  const restoreSong = useCallback((song: Song) => {
    setCurrentSong((prev) => prev ?? song);
  }, []);

  /** پخش یک آهنگ از یک لیست (لیست می‌شه صف پخش) */
  const playSongFromList = useCallback(
    (song: Song, list: Song[]) => {
      remember(song.id);
      setQueue(list);
      playedIds.current = new Set([song.id]);
      start(song);
    },
    [remember, start]
  );

  /** رفتن به آهنگ بعدی. اگه آهنگ بعدی‌ای نباشه false برمی‌گردونه */
  const playNext = useCallback((): boolean => {
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
  }, [baseList, currentSong?.id, isShuffle, remember, repeatMode, start]);

  /** رفتن به آهنگ قبلی (در شافل: آخرین آهنگی که واقعاً گوش داده شده). اگه نباشه false */
  const playPrev = useCallback((): boolean => {
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
  }, [baseList, currentSong?.id, isShuffle, repeatMode, start]);

  const setShuffle = useCallback(
    (value: boolean) => {
      setIsShuffleState(value);
      playedIds.current = new Set(currentSong ? [currentSong.id] : []);
    },
    [currentSong, setIsShuffleState]
  );

  const addToQueue = useCallback((song: Song) => setQueue((prev) => [...prev, song]), []);

  /** حذف با اندیس (نه id) تا اگه یه آهنگ دو بار توی صف بود، فقط همون یکی حذف بشه */
  const removeFromQueueAt = useCallback(
    (index: number) => setQueue((prev) => prev.filter((_, i) => i !== index)),
    []
  );

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => setQueue((prev) => moveItem(prev, fromIndex, toIndex)),
    []
  );

  /** پخش مستقیم یکی از آهنگ‌های داخل صف */
  const playQueueSongAt = useCallback(
    (index: number) => {
      const target = queue[index];
      if (!target) return;
      remember(target.id);
      playedIds.current.add(target.id);
      start(target);
    },
    [queue, remember, start]
  );

  /** پاک کردن کل صف پخش */
  const clearQueue = useCallback(() => setQueue([]), []);

  /** بر زدن تصادفی آهنگ‌های صف پخش (با حفظ موقعیت آهنگ در حال پخش) */
  const shuffleQueue = useCallback(() => {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;
      const currentId = currentSong?.id;
      const currentIdx = currentId ? prev.findIndex((s) => s.id === currentId) : -1;

      if (currentIdx === -1 || currentIdx >= prev.length - 2) {
        const copy = [...prev];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      }

      const head = prev.slice(0, currentIdx + 1);
      const tail = prev.slice(currentIdx + 1);
      for (let i = tail.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tail[i], tail[j]] = [tail[j], tail[i]];
      }
      return [...head, ...tail];
    });
  }, [currentSong?.id]);

  /** جابه‌جایی آهنگ به جایگاه بعدی برای پخش فوری پس از آهنگ جاری */
  const playNextInQueue = useCallback(
    (index: number) => {
      if (index === 0) return;
      reorderQueue(index, 0);
    },
    [reorderQueue]
  );

  /** جابه‌جایی یک آهنگ یک پله به بالا یا پایین */
  const moveQueueItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= queue.length) return;
      reorderQueue(fromIndex, toIndex);
    },
    [queue.length, reorderQueue]
  );

  /** وقتی اطلاعات یه آهنگ ویرایش شد، نسخه‌ی داخل صف و پلیر رو هم به‌روز کن */
  const syncSong = useCallback((updated: Song) => {
    setQueue((prev) => prev.map((song) => (song.id === updated.id ? updated : song)));
    setCurrentSong((current) => (current?.id === updated.id ? updated : current));
  }, []);

  /** وقتی آهنگی از کتابخانه حذف شد: از صف در بیار و اگه در حال پخش بود، پلیر رو خالی کن */
  const removeSong = useCallback((id: string) => {
    setQueue((prev) => prev.filter((song) => song.id !== id));
    setCurrentSong((current) => (current?.id === id ? null : current));
  }, []);

  return {
    currentSong,
    queue,
    repeatMode,
    isShuffle,
    playToken,
    setRepeatMode,
    setShuffle,
    restoreSong,
    playSongFromList,
    playNext,
    playPrev,
    addToQueue,
    removeFromQueueAt,
    reorderQueue,
    playQueueSongAt,
    clearQueue,
    shuffleQueue,
    playNextInQueue,
    moveQueueItem,
    syncSong,
    removeSong,
  };
};
