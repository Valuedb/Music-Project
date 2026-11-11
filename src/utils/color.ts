const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * رنگ hex را با شفافیت دلخواه به rgba تبدیل می‌کند (مثلاً برای پس‌زمینه‌ی شیشه‌ای).
 * فرمت‌های #rgb و #rrggbb پشتیبانی می‌شوند؛ هر مقدار دیگر بدون تغییر برمی‌گردد.
 *
 * @param alpha عددی بین ۰ و ۱ (خارج از این بازه محدود می‌شود)
 */
export const withAlpha = (color: string, alpha: number): string => {
  const trimmed = color.trim();
  if (!HEX_COLOR.test(trimmed)) return color;

  const digits = trimmed.slice(1);
  const full = digits.length === 3 ? [...digits].map((c) => c + c).join('') : digits;
  const value = Number.parseInt(full, 16);
  const safeAlpha = Math.min(1, Math.max(0, alpha));

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${safeAlpha})`;
};
