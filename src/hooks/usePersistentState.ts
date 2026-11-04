import { useEffect, useState } from 'react';
import { readJSON, writeJSON } from '../storage/safeStorage';

/**
 * مثل useState ولی مقدار در localStorage ذخیره و موقع شروع بازیابی می‌شه.
 * خواندن و نوشتن امنه (روی داده‌ی خراب یا حافظه‌ی پر برنامه کرش نمی‌کنه).
 */
export const usePersistentState = <T>(key: string, fallback: T, isValid?: (value: unknown) => value is T) => {
  const [value, setValue] = useState<T>(() => readJSON(key, fallback, isValid));

  useEffect(() => {
    writeJSON(key, value);
  }, [key, value]);

  return [value, setValue] as const;
};
