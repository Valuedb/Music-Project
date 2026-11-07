import type { EqualizerPreset, EqualizerSettings } from '../types';

/** ۵ باند فرکانسی استاندارد اکولایزر */
export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000] as const;
export const EQ_BAND_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'] as const;

/** پریست‌های استاندارد اکولایزر */
export const EQ_PRESETS: Record<EqualizerPreset, { bands: number[]; bassBoost: number }> = {
  flat: { bands: [0, 0, 0, 0, 0], bassBoost: 0 },
  bassBoost: { bands: [6, 4, 1, 0, 0], bassBoost: 8 },
  pop: { bands: [-1, 2, 4, 3, -1], bassBoost: 2 },
  rock: { bands: [5, 3, -1, 3, 5], bassBoost: 4 },
  jazz: { bands: [3, 2, -1, 2, 3], bassBoost: 1 },
  vocal: { bands: [-2, 0, 4, 3, 1], bassBoost: 0 },
  electronic: { bands: [6, 4, 0, 2, 5], bassBoost: 6 },
  custom: { bands: [0, 0, 0, 0, 0], bassBoost: 0 },
};

/** مقادیر پیش‌فرض */
export const DEFAULT_EQ_SETTINGS: EqualizerSettings = {
  enabled: true,
  preset: 'flat',
  bands: [0, 0, 0, 0, 0],
  bassBoost: 0,
};

/**
 * مدیر افکت‌های صوتی و اکولایزر تحت وب با استفاده از Web Audio API
 */
class AudioEffectsManager {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private bandFilters: BiquadFilterNode[] = [];
  private attachedElement: HTMLAudioElement | null = null;
  private currentSettings: EqualizerSettings = { ...DEFAULT_EQ_SETTINGS };
  private listeners: Set<(settings: EqualizerSettings) => void> = new Set();

  /**
   * اتصال زنجیره افکت‌ها به المان صوتی (ایمن برای جلوگیری از InvalidStateError)
   */
  public attach(audio: HTMLAudioElement) {
    if (this.attachedElement === audio && this.sourceNode) return;
    this.attachedElement = audio;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      // ساخت نود سورس یک‌بار برای هر المان صوتی
      this.sourceNode = this.audioCtx.createMediaElementSource(audio);

      // فیلتر اختصاصی تقویت باس (LowShelf در فرکانس ۸۰ هرتز)
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 80;
      this.bassFilter.gain.value = this.currentSettings.enabled ? this.currentSettings.bassBoost : 0;

      // ساخت ۵ باند فرکانسی
      this.bandFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.currentSettings.enabled ? (this.currentSettings.bands[index] ?? 0) : 0;
        return filter;
      });

      // اتصال زنجیره‌ای به ترتیب:
      // سورس -> فیلتر باس -> باندهای ۱ تا ۵ -> خروجی بلندگو
      let lastNode: AudioNode = this.sourceNode;
      lastNode.connect(this.bassFilter);
      lastNode = this.bassFilter;

      for (const filter of this.bandFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn('[AudioEffects] اتصال به Web Audio API ناموفق بود:', err);
    }
  }

  /**
   * فعال‌سازی مجدد کانتکست صوتی در صورت معلق شدن توسط مرورگر
   */
  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * اعمال تغییرات اکولایزر بر روی نودهای صوتی به صورت آنی
   */
  public applySettings(newSettings: EqualizerSettings) {
    this.currentSettings = { ...newSettings };
    const { enabled, bands, bassBoost } = newSettings;

    if (this.bassFilter) {
      this.bassFilter.gain.value = enabled ? bassBoost : 0;
    }

    this.bandFilters.forEach((filter, index) => {
      const gainVal = enabled ? (bands[index] ?? 0) : 0;
      filter.gain.value = gainVal;
    });

    this.notify();
  }

  /**
   * خواندن تنظیمات جاری
   */
  public getSettings(): EqualizerSettings {
    return { ...this.currentSettings };
  }

  /**
   * اشتراک در تغییرات اکولایزر
   */
  public subscribe(listener: (settings: EqualizerSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.currentSettings));
  }
}

export const audioEffects = new AudioEffectsManager();
