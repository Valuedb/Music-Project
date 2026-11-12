import { useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '../storage/safeStorage';

/**
 * مثل useState ولی مقدار در localStorage ذخیره و موقع شروع بازیابی می‌شه.
 * نوشتن با تاخیر کوتاه انجام می‌شود تا رابط کاربری در دسکتاپ هنگام تغییرات پیاپی قفل نشود
 * و هنگام بسته‌شدن برنامه هم بی‌درنگ روی دیسک ذخیره می‌گردد.
 */
export const usePersistentState = <T>(
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T
) => {
  const [value, setValue] = useState<T>(() => readJSON(key, fallback, isValid));
  const isFirstRender = useRef(true);
  const latestRef = useRef({ key, value });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    latestRef.current = { key, value };
  }, [key, value]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    dirtyRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        writeJSON(latestRef.current.key, latestRef.current.value);
      }
    }, 180);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [key, value]);

  // ذخیره قطعی هنگام بستن پنجره یا مخفی شدن تب در ویندوز
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (dirtyRef.current) {
        dirtyRef.current = false;
        writeJSON(latestRef.current.key, latestRef.current.value);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
      flush();
    };
  }, []);

  return [value, setValue] as const;
};
