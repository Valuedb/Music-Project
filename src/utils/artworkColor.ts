const extractedAccentCache = new Map<string, string | null>();

const toHex = (value: number): string =>
  Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
};

/**
 * استخراج رنگ غالب و باکنتراست مناسب از تصویر کاور آهنگ
 * برای هماهنگ‌سازی رنگ تاکیدی برنامه با کاور فعلی
 */
export const extractDominantHex = async (
  imageUrl: string,
  preferLightSurface = false
): Promise<string | null> => {
  if (!imageUrl || typeof document === 'undefined') return null;
  const cacheKey = `${preferLightSurface ? 'L' : 'D'}:${imageUrl}`;
  if (extractedAccentCache.has(cacheKey)) {
    return extractedAccentCache.get(cacheKey) ?? null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          extractedAccentCache.set(cacheKey, null);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let weightSum = 0;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 140) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const [, s, l] = rgbToHsl(r, g, b);
          if (l < 0.08 || l > 0.94) continue;
          const weight = 0.25 + s * 2.4;
          rSum += r * weight;
          gSum += g * weight;
          bSum += b * weight;
          weightSum += weight;
        }

        if (weightSum === 0) {
          extractedAccentCache.set(cacheKey, null);
          resolve(null);
          return;
        }

        const avgR = rSum / weightSum;
        const avgG = gSum / weightSum;
        const avgB = bSum / weightSum;
        const [h, s, l] = rgbToHsl(avgR, avgG, avgB);

        const tunedS = Math.max(0.48, Math.min(0.88, s * 1.15));
        const tunedL = preferLightSurface
          ? Math.max(0.36, Math.min(0.48, l))
          : Math.max(0.54, Math.min(0.68, l));
        const [fr, fg, fb] = hslToRgb(h, tunedS, tunedL);
        const hex = `#${toHex(fr)}${toHex(fg)}${toHex(fb)}`;
        extractedAccentCache.set(cacheKey, hex);
        resolve(hex);
      } catch {
        extractedAccentCache.set(cacheKey, null);
        resolve(null);
      }
    };

    img.onerror = () => {
      extractedAccentCache.set(cacheKey, null);
      resolve(null);
    };

    img.src = imageUrl;
  });
};
