import type { Song } from '../types';

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function createWavDataUri(frequency: number, durationSeconds: number, isChord = true): string {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new Uint8Array(44 + numSamples * 2);
  const view = new DataView(buffer.buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.3);
    const release = Math.min(1, (durationSeconds - t) / 0.8);
    const env = Math.max(0, attack * release);

    const val = isChord
      ? Math.sin(2 * Math.PI * frequency * t) * 0.4 +
        Math.sin(2 * Math.PI * frequency * 1.2599 * t) * 0.3 +
        Math.sin(2 * Math.PI * frequency * 1.4983 * t) * 0.3
      : Math.sin(2 * Math.PI * frequency * t) * 0.6;

    const sample = Math.max(-32768, Math.min(32767, Math.floor(val * env * 14000)));
    view.setInt16(44 + i * 2, sample, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function createCoverSvg(title: string, color1: string, color2: string, icon: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" rx="36" fill="url(#g)"/>
    <circle cx="150" cy="140" r="64" fill="rgba(255,255,255,0.12)"/>
    <text x="150" y="155" font-size="56" text-anchor="middle" dominant-baseline="middle">${icon}</text>
    <text x="150" y="240" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="600" fill="#ffffff" text-anchor="middle" opacity="0.95">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * دمو ترک‌های پیش‌فرض، ۱۰۰٪ لوکال و آفلاین بدون وابستگی به شبکه
 */
export const DEMO_SONGS: Song[] = [
  {
    id: 'demo-1',
    name: 'Acoustic Memories',
    artist: 'Julian Sky',
    album: 'Quiet Reflections',
    year: '2024',
    duration: 12,
    playCount: 4,
    addedAt: Date.now() - 86400000 * 3,
    cover: createCoverSvg('Acoustic Memories', '#FA2D48', '#FF7A59', '🎸'),
    fileUrl: createWavDataUri(261.63, 12, true), // C4 chord
  },
  {
    id: 'demo-2',
    name: 'Midnight Sunset',
    artist: 'Luna Eclipse',
    album: 'Neon Horizon',
    year: '2024',
    duration: 10,
    playCount: 7,
    addedAt: Date.now() - 86400000 * 2,
    cover: createCoverSvg('Midnight Sunset', '#5E5CE6', '#BF5AF2', '🌆'),
    fileUrl: createWavDataUri(329.63, 10, true), // E4 chord
  },
  {
    id: 'demo-3',
    name: 'Starlight Serenade',
    artist: 'Aria Thorne',
    album: 'Velvet Nights',
    year: '2023',
    duration: 14,
    playCount: 12,
    addedAt: Date.now() - 86400000,
    cover: createCoverSvg('Starlight Serenade', '#0A84FF', '#5AC8FA', '✨'),
    fileUrl: createWavDataUri(392.0, 14, true), // G4 chord
  },
];
