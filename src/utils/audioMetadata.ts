import type { Song } from '../types';
import { saveAudioBlob } from '../storage/mediaStore';

/** تبدیل Blob تصویر کاور به Data URL فشرده (حداکثر ۳۶۰ پیکسل) برای ماندگاری همیشگی در localStorage */
export const blobToCompactDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxSize = 360;
          const scale = Math.min(1, maxSize / Math.max(img.width || maxSize, img.height || maxSize));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });

/** ساخت کاور پیش‌فرض محلی با SVG زمانی که فایل صوتی کاور ندارد */
export const createFallbackCoverSvg = (title: string): string => {
  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" rx="36" fill="url(#bg)"/>
    <circle cx="150" cy="135" r="56" fill="rgba(255,255,255,0.08)"/>
    <path d="M168 102v52.5a15.5 15.5 0 1 1-10-14.5V115l-24 6.5v39a15.5 15.5 0 1 1-10-14.5V111l44-9z" fill="rgba(255,255,255,0.72)"/>
    <text x="150" y="238" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600" fill="rgba(255,255,255,0.88)" text-anchor="middle">${safeTitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const isAudioUploadFile = (file: File): boolean =>
  file.type.startsWith('audio/') ||
  /\.(mp3|m4a|wav|flac|ogg|aac|opus|weba|wma)$/i.test(file.name);

/** استخراج مسیر پوشه نسبی از فایل‌های آپلودشده با انتخاب فولدر */
export const extractFolderFromFile = (file: File, explicitFolder?: string): string | undefined => {
  if (explicitFolder) return explicitFolder;
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (!rel || !rel.includes('/')) return undefined;
  const parts = rel.split('/').filter(Boolean);
  if (parts.length <= 1) return undefined;
  parts.pop();
  return parts.join('/');
};

/** استخراج متادیتا و ساخت آبجکت Song از یک فایل صوتی همراه با بارگذاری تنبل کتابخانه متادیتا */
export const extractSongFromFile = async (
  file: File,
  fallbackFolder?: string
): Promise<Song | null> => {
  try {
    const { parseBlob } = await import('music-metadata');
    const metadata = await parseBlob(file);
    const title = metadata.common.title || file.name.replace(/\.[^/.]+$/, '');
    let coverUrl = '';

    const picture = metadata.common.picture?.[0];
    if (picture) {
      const blob = new Blob([picture.data as BlobPart], { type: picture.format || 'image/jpeg' });
      coverUrl = await blobToCompactDataUrl(blob);
    }

    if (!coverUrl) {
      coverUrl = createFallbackCoverSvg(title);
    }

    let duration = metadata.format.duration || 0;

    if (duration === 0) {
      duration = await new Promise<number>((resolve) => {
        const tempUrl = URL.createObjectURL(file);
        const audio = new Audio(tempUrl);
        audio.onloadedmetadata = () => {
          const d = Number.isFinite(audio.duration) ? audio.duration : 0;
          URL.revokeObjectURL(tempUrl);
          resolve(d);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(tempUrl);
          resolve(0);
        };
      });
    }

    const id = crypto.randomUUID();
    await saveAudioBlob(id, file);

    const detectedFolder = extractFolderFromFile(file) || fallbackFolder?.trim() || undefined;

    return {
      id,
      name: title,
      artist: metadata.common.artist || 'Unknown',
      album: metadata.common.album,
      year: metadata.common.year ? String(metadata.common.year) : undefined,
      folder: detectedFolder,
      cover: coverUrl,
      fileUrl: URL.createObjectURL(file),
      playCount: 0,
      addedAt: Date.now(),
      duration,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export interface AudioFileWithFolder {
  file: File;
  folder?: string;
}

/** پردازش دسته‌ای و هم‌زمان فایل‌های صوتی برای جلوگیری از کندی هنگام ایمپورت پوشه‌های بزرگ ویندوز */
export const extractSongsBatched = async (
  items: (File | AudioFileWithFolder)[],
  fallbackFolder?: string,
  batchSize = 4
): Promise<Song[]> => {
  const normalized: AudioFileWithFolder[] = items
    .map((item) => (item instanceof File ? { file: item } : item))
    .filter((entry) => isAudioUploadFile(entry.file));

  const results: Song[] = [];
  for (let i = 0; i < normalized.length; i += batchSize) {
    const slice = normalized.slice(i, i + batchSize);
    const extracted = await Promise.all(
      slice.map((entry) => extractSongFromFile(entry.file, entry.folder ?? fallbackFolder))
    );
    for (const s of extracted) {
      if (s) results.push(s);
    }
  }
  return results;
};

interface WebkitEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (f: File) => void, err?: (e: unknown) => void) => void;
  createReader?: () => { readEntries: (cb: (entries: WebkitEntry[]) => void, err?: (e: unknown) => void) => void };
}

const readEntryRecursive = async (entry: WebkitEntry, parentPath = ''): Promise<AudioFileWithFolder[]> => {
  if (entry.isFile && entry.file) {
    return new Promise((resolve) => {
      entry.file!(
        (file) => {
          if (isAudioUploadFile(file)) {
            resolve([{ file, folder: parentPath || undefined }]);
          } else {
            resolve([]);
          }
        },
        () => resolve([])
      );
    });
  }

  if (entry.isDirectory && entry.createReader) {
    const folderPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    const reader = entry.createReader();
    const allEntries: WebkitEntry[] = [];

    const readBatch = (): Promise<void> =>
      new Promise((resolve) => {
        reader.readEntries(
          (entries) => {
            if (!entries || entries.length === 0) {
              resolve();
              return;
            }
            allEntries.push(...entries);
            readBatch().then(resolve);
          },
          () => resolve()
        );
      });

    await readBatch();
    const nested = await Promise.all(allEntries.map((child) => readEntryRecursive(child, folderPath)));
    return nested.flat();
  }

  return [];
};

/** استخراج فایل‌ها و زیرپوشه‌های صوتی از رویداد Drag & Drop دسکتاپ ویندوز */
export const extractDroppedAudioFiles = async (dataTransfer: DataTransfer): Promise<AudioFileWithFolder[]> => {
  const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];
  const entries = items
    .map(
      (item) =>
        ((item as DataTransferItem & { webkitGetAsEntry?: () => unknown }).webkitGetAsEntry?.() ??
          null) as WebkitEntry | null
    )
    .filter((entry): entry is WebkitEntry => Boolean(entry));

  if (entries.length > 0) {
    const collected = await Promise.all(entries.map((entry) => readEntryRecursive(entry)));
    return collected.flat();
  }

  return Array.from(dataTransfer.files)
    .filter(isAudioUploadFile)
    .map((file) => ({ file }));
};
