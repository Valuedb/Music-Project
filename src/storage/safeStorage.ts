/**
 * خواندن و نوشتن امن JSON در localStorage.
 * هیچ‌کدوم exception پرت نمی‌کنن: خرابی داده یا پر شدن حافظه نباید برنامه رو سفید کنه.
 */

export const readJSON = <T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T => {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) throw new Error('invalid shape');
    return parsed as T;
  } catch (error) {
    console.warn(`[storage] داده‌ی "${key}" قابل خواندن نبود، مقدار پیش‌فرض استفاده شد`, error);
    // نسخه‌ی خراب رو نگه می‌داریم تا با نوشتن مقدار جدید برای همیشه از بین نره
    if (raw !== null) {
      try {
        localStorage.setItem(`${key}.corrupt`, raw);
      } catch {
        /* جا برای نسخه‌ی پشتیبان نبود */
      }
    }
    return fallback;
  }
};

export const writeJSON = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] ذخیره‌ی "${key}" ناموفق بود`, error);
    return false;
  }
};
