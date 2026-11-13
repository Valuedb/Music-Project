import type {
  EqualizerPreset,
  EqualizerSettings,
  ReverbRoom,
  SoundSettings,
} from '../types';

/** ۵ باند فرکانسی استاندارد اکولایزر */
export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000] as const;
export const EQ_BAND_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'] as const;

/** ۱۰ باند فرکانسی حرفه‌ای اکولایزر (یک اکتاو کامل ISO) */
export const EQ10_FREQUENCIES = [
  31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;
export const EQ10_BAND_LABELS = [
  '31Hz',
  '62Hz',
  '125Hz',
  '250Hz',
  '500Hz',
  '1kHz',
  '2kHz',
  '4kHz',
  '8kHz',
  '16kHz',
] as const;

/** پریست‌های استاندارد ۵ بانده اکولایزر */
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

/** پریست‌های ۱۰ بانده متناظر */
export const EQ10_PRESETS: Record<EqualizerPreset, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: [7, 6, 4, 2, 1, 0, 0, 0, 0, 0],
  pop: [-2, -1, 1, 3, 4, 4, 2, 1, -1, -1],
  rock: [5, 4, 2, 1, -1, -1, 2, 4, 5, 5],
  jazz: [4, 3, 1, 2, -1, -1, 0, 2, 3, 4],
  vocal: [-3, -2, -1, 1, 3, 5, 4, 3, 1, 0],
  electronic: [6, 5, 3, 0, -1, 1, 2, 4, 5, 6],
  custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/** مقادیر پیش‌فرض اکولایزر */
export const DEFAULT_EQ_SETTINGS: EqualizerSettings = {
  enabled: true,
  preset: 'flat',
  bands: [0, 0, 0, 0, 0],
  bassBoost: 0,
};

/** مقادیر پیش‌فرض تنظیمات جامع صدا */
export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  crossfadeSeconds: 0,
  fadeOnPlayPause: true,
  gaplessPlayback: true,
  playbackSpeed: 1,
  preservePitch: true,
  reverbRoom: 'off',
  reverbMix: 0.28,
  spatialSurround: 0,
  volumeNormalization: false,
  stereoBalance: 0,
  monoAudio: false,
  preampDb: 0,
  maxVolumeLimit: 100,
  eqMode: '5band',
  bands10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  outputProfile: 'default',
  profilePresets: {},
  liveVisualizer: true,
};

interface AttachedDeck {
  source: MediaElementAudioSourceNode;
  deckGain: GainNode;
}

/**
 * مدیر افکت‌های صوتی و اکولایزر تحت وب با استفاده از Web Audio API
 * پشتیبانی هم‌زمان از دو دک پخش (برای Crossfade و Gapless)، اکولایزر ۵/۱۰ بانده،
 * نرمال‌سازی صدا، ریورب آکوستیک، صدای سه‌بعدی، بالانس استریو و آنالایزر زنده
 */
class AudioEffectsManager {
  private audioCtx: AudioContext | null = null;
  private decks = new Map<HTMLAudioElement, AttachedDeck>();

  private masterBus: GainNode | null = null;
  private monoRouter: GainNode | null = null;
  private preampNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private bandFilters5: BiquadFilterNode[] = [];
  private bandFilters10: BiquadFilterNode[] = [];

  // شبکه صدای سه‌بعدی (Mid-Side Stereo Widener)
  private spatialSplitter: ChannelSplitterNode | null = null;
  private spatialMerger: ChannelMergerNode | null = null;
  private lDirectGain: GainNode | null = null;
  private rDirectGain: GainNode | null = null;
  private lCrossGain: GainNode | null = null;
  private rCrossGain: GainNode | null = null;

  // شبکه ریورب (Convolver + Dry/Wet + Warm Lowpass)
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private reverbToneFilter: BiquadFilterNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbBuffers = new Map<ReverbRoom, AudioBuffer>();
  private activeReverbRoom: ReverbRoom = 'off';

  // نرمال‌ساز / کمپرسور و بالانس استریو و آنالایزر
  private compressor: DynamicsCompressorNode | null = null;
  private normMakeupGain: GainNode | null = null;
  private balancePanner: StereoPannerNode | null = null;
  private analyser: AnalyserNode | null = null;

  private currentEqSettings: EqualizerSettings = { ...DEFAULT_EQ_SETTINGS };
  private currentSoundSettings: SoundSettings = { ...DEFAULT_SOUND_SETTINGS };

  /** ساخت زنجیره مشترک DSP روی AudioContext */
  private ensureGraph() {
    if (this.masterBus && this.audioCtx) return true;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;

    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    const ctx = this.audioCtx;

    this.masterBus = ctx.createGain();
    this.monoRouter = ctx.createGain();
    this.preampNode = ctx.createGain();

    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 80;

    this.bandFilters5 = EQ_FREQUENCIES.map((freq, index) => {
      const filter = ctx.createBiquadFilter();
      if (index === 0) filter.type = 'lowshelf';
      else if (index === EQ_FREQUENCIES.length - 1) filter.type = 'highshelf';
      else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      return filter;
    });

    this.bandFilters10 = EQ10_FREQUENCIES.map((freq, index) => {
      const filter = ctx.createBiquadFilter();
      if (index === 0) filter.type = 'lowshelf';
      else if (index === EQ10_FREQUENCIES.length - 1) filter.type = 'highshelf';
      else {
        filter.type = 'peaking';
        filter.Q.value = 1.41;
      }
      filter.frequency.value = freq;
      return filter;
    });

    // شبکه Mid-Side Stereo Widener
    this.spatialSplitter = ctx.createChannelSplitter(2);
    this.spatialMerger = ctx.createChannelMerger(2);
    this.lDirectGain = ctx.createGain();
    this.rDirectGain = ctx.createGain();
    this.lCrossGain = ctx.createGain();
    this.rCrossGain = ctx.createGain();

    // شبکه ریورب
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.reverbToneFilter = ctx.createBiquadFilter();
    this.reverbToneFilter.type = 'lowpass';
    this.reverbToneFilter.frequency.value = 4800;
    this.convolver = ctx.createConvolver();

    // کمپرسور نرمال‌سازی + بالانس + آنالایزر
    this.compressor = ctx.createDynamicsCompressor();
    this.normMakeupGain = ctx.createGain();
    this.balancePanner = ctx.createStereoPanner();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.65;

    // اتصال زنجیره: masterBus -> monoRouter -> preampNode -> bassFilter -> EQ5 -> EQ10
    let lastNode: AudioNode = this.masterBus;
    lastNode.connect(this.monoRouter);
    lastNode = this.monoRouter;

    lastNode.connect(this.preampNode);
    lastNode = this.preampNode;

    lastNode.connect(this.bassFilter);
    lastNode = this.bassFilter;

    for (const f of this.bandFilters5) {
      lastNode.connect(f);
      lastNode = f;
    }
    for (const f of this.bandFilters10) {
      lastNode.connect(f);
      lastNode = f;
    }

    // Spatial Mid-Side
    lastNode.connect(this.spatialSplitter);
    this.spatialSplitter.connect(this.lDirectGain, 0);
    this.spatialSplitter.connect(this.rCrossGain, 1);
    this.spatialSplitter.connect(this.rDirectGain, 1);
    this.spatialSplitter.connect(this.lCrossGain, 0);

    this.lDirectGain.connect(this.spatialMerger, 0, 0);
    this.rCrossGain.connect(this.spatialMerger, 0, 0);
    this.rDirectGain.connect(this.spatialMerger, 0, 1);
    this.lCrossGain.connect(this.spatialMerger, 0, 1);

    // Dry / Wet Reverb
    this.spatialMerger.connect(this.dryGain);
    this.spatialMerger.connect(this.convolver);
    this.convolver.connect(this.reverbToneFilter);
    this.reverbToneFilter.connect(this.wetGain);

    this.dryGain.connect(this.compressor);
    this.wetGain.connect(this.compressor);

    this.compressor.connect(this.normMakeupGain);
    this.normMakeupGain.connect(this.balancePanner);
    this.balancePanner.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    this.syncGraphValues();
    return true;
  }

  /** تولید Impulse Response استریو برای شبیه‌سازی فضای اتاق/سالن/کلیسا */
  private getImpulseBuffer(room: ReverbRoom): AudioBuffer | null {
    if (!this.audioCtx || room === 'off') return null;
    const cached = this.reverbBuffers.get(room);
    if (cached) return cached;

    const sampleRate = this.audioCtx.sampleRate;
    const duration = room === 'studio' ? 0.55 : room === 'hall' ? 1.55 : 2.85;
    const decay = room === 'studio' ? 3.2 : room === 'hall' ? 2.4 : 1.9;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.audioCtx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        // کاهش نمایی نرم با شروع ملایم (Pre-delay احساسی)
        const env = Math.pow(1 - progress, decay) * Math.min(1, i / (sampleRate * 0.012));
        channelData[i] = (Math.random() * 2 - 1) * env * 0.55;
      }
    }

    this.reverbBuffers.set(room, impulse);
    return impulse;
  }

  /**
   * اتصال یک المان صوتی (دک A یا B) به زنجیره مشترک افکت‌ها
   */
  public attach(audio: HTMLAudioElement) {
    if (this.decks.has(audio)) return;
    try {
      if (!this.ensureGraph() || !this.audioCtx || !this.masterBus) return;
      const source = this.audioCtx.createMediaElementSource(audio);
      const deckGain = this.audioCtx.createGain();
      deckGain.gain.value = 1;
      source.connect(deckGain);
      deckGain.connect(this.masterBus);
      this.decks.set(audio, { source, deckGain });
    } catch (err) {
      console.warn('[AudioEffects] اتصال به Web Audio API ناموفق بود:', err);
    }
  }

  /** فعال‌سازی مجدد کانتکست صوتی در صورت معلق شدن توسط مرورگر */
  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /** لغو رمپ‌های گین قبلی روی یک دک */
  public cancelDeckFade(audio: HTMLAudioElement) {
    const deck = this.decks.get(audio);
    if (!deck || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    deck.deckGain.gain.cancelScheduledValues(now);
  }

  /** تنظیم یا رمپ نرم گین یک دک (برای Crossfade و Fade on Play/Pause) */
  public setDeckGain(audio: HTMLAudioElement, targetGain: number, rampSeconds: number = 0) {
    const deck = this.decks.get(audio);
    if (!deck || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const clamped = Math.max(0, Math.min(1, targetGain));
    const param = deck.deckGain.gain;
    param.cancelScheduledValues(now);
    if (rampSeconds <= 0.005) {
      param.setValueAtTime(clamped, now);
    } else {
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(clamped, now + rampSeconds);
    }
  }

  /** همگام‌سازی تمام پارامترهای گراف صوتی با استیت فعلی */
  private syncGraphValues() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const eq = this.currentEqSettings;
    const snd = this.currentSoundSettings;

    // 1. مونو / استریو
    if (this.monoRouter) {
      if (snd.monoAudio) {
        this.monoRouter.channelCount = 1;
        this.monoRouter.channelCountMode = 'explicit';
        this.monoRouter.channelInterpretation = 'speakers';
      } else {
        this.monoRouter.channelCount = 2;
        this.monoRouter.channelCountMode = 'max';
        this.monoRouter.channelInterpretation = 'speakers';
      }
    }

    // 2. Pre-Amp
    if (this.preampNode) {
      const linear = Math.pow(10, Math.max(-12, Math.min(12, snd.preampDb)) / 20);
      this.preampNode.gain.setTargetAtTime(linear, now, 0.02);
    }

    // 3. Bass Boost & 5-band / 10-band EQ
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(eq.enabled ? eq.bassBoost : 0, now, 0.02);
    }

    const use10 = snd.eqMode === '10band';
    this.bandFilters5.forEach((filter, idx) => {
      const val = eq.enabled && !use10 ? (eq.bands[idx] ?? 0) : 0;
      filter.gain.setTargetAtTime(val, now, 0.02);
    });
    this.bandFilters10.forEach((filter, idx) => {
      const val = eq.enabled && use10 ? (snd.bands10[idx] ?? 0) : 0;
      filter.gain.setTargetAtTime(val, now, 0.02);
    });

    // 4. Spatial Surround (Mid-Side Widener)
    if (
      this.lDirectGain &&
      this.rDirectGain &&
      this.lCrossGain &&
      this.rCrossGain
    ) {
      const w = snd.monoAudio ? 0 : (Math.max(0, Math.min(100, snd.spatialSurround)) / 100) * 0.45;
      this.lDirectGain.gain.setTargetAtTime(1 + w, now, 0.025);
      this.rDirectGain.gain.setTargetAtTime(1 + w, now, 0.025);
      this.lCrossGain.gain.setTargetAtTime(-w, now, 0.025);
      this.rCrossGain.gain.setTargetAtTime(-w, now, 0.025);
    }

    // 5. Reverb Room & Mix
    if (this.convolver && this.dryGain && this.wetGain && this.reverbToneFilter) {
      if (snd.reverbRoom !== this.activeReverbRoom) {
        this.activeReverbRoom = snd.reverbRoom;
        if (snd.reverbRoom !== 'off') {
          this.convolver.buffer = this.getImpulseBuffer(snd.reverbRoom);
        }
      }
      const isReverbOn = snd.reverbRoom !== 'off' && snd.reverbMix > 0;
      const mix = isReverbOn ? Math.max(0, Math.min(1, snd.reverbMix)) : 0;
      const cutoff =
        snd.reverbRoom === 'studio' ? 7200 : snd.reverbRoom === 'hall' ? 4600 : 3100;
      this.reverbToneFilter.frequency.setTargetAtTime(cutoff, now, 0.03);
      this.dryGain.gain.setTargetAtTime(1 - mix * 0.35, now, 0.025);
      this.wetGain.gain.setTargetAtTime(mix * 0.72, now, 0.025);
    }

    // 6. Volume Normalization / Smart Limiter
    if (this.compressor && this.normMakeupGain) {
      if (snd.volumeNormalization) {
        this.compressor.threshold.setTargetAtTime(-22, now, 0.03);
        this.compressor.knee.setTargetAtTime(24, now, 0.03);
        this.compressor.ratio.setTargetAtTime(6, now, 0.03);
        this.compressor.attack.setTargetAtTime(0.005, now, 0.03);
        this.compressor.release.setTargetAtTime(0.22, now, 0.03);
        this.normMakeupGain.gain.setTargetAtTime(1.32, now, 0.03);
      } else {
        this.compressor.threshold.setTargetAtTime(-1, now, 0.03);
        this.compressor.knee.setTargetAtTime(4, now, 0.03);
        this.compressor.ratio.setTargetAtTime(1, now, 0.03);
        this.normMakeupGain.gain.setTargetAtTime(1, now, 0.03);
      }
    }

    // 7. Stereo Balance
    if (this.balancePanner) {
      const pan = snd.monoAudio ? 0 : Math.max(-1, Math.min(1, snd.stereoBalance));
      this.balancePanner.pan.setTargetAtTime(pan, now, 0.02);
    }
  }

  /** اعمال تنظیمات اکولایزر */
  public applySettings(newSettings: EqualizerSettings) {
    this.currentEqSettings = { ...newSettings };
    this.syncGraphValues();
  }

  /** اعمال تنظیمات جامع صدا */
  public applySoundSettings(newSettings: SoundSettings) {
    this.currentSoundSettings = { ...newSettings };
    this.syncGraphValues();
  }

  /** دریافت داده فرکانسی لحظه‌ای برای Visualizer زنده */
  public getFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser || !this.audioCtx || this.audioCtx.state !== 'running') {
      return false;
    }
    this.analyser.getByteFrequencyData(target);
    return true;
  }

  /** دریافت تعداد باین‌های آنالایزر */
  public getFrequencyBinCount(): number {
    return this.analyser ? this.analyser.frequencyBinCount : 128;
  }

  public getSettings(): EqualizerSettings {
    return this.currentEqSettings;
  }

  public getSoundSettings(): SoundSettings {
    return this.currentSoundSettings;
  }
}

export const audioEffects = new AudioEffectsManager();
