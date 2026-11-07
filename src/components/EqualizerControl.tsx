import React from 'react';
import { Sliders, Volume2, Sparkles } from 'lucide-react';
import type { EqualizerPreset, EqualizerSettings } from '../types';
import { EQ_BAND_LABELS, EQ_PRESETS } from '../player/audioEffects';

interface EqualizerControlProps {
  settings: EqualizerSettings;
  onChange: (newSettings: EqualizerSettings) => void;
  theme: any;
  t: any;
}

const PRESET_KEYS: { id: EqualizerPreset; labelKey: string }[] = [
  { id: 'flat', labelKey: 'presetFlat' },
  { id: 'bassBoost', labelKey: 'presetBassBoost' },
  { id: 'pop', labelKey: 'presetPop' },
  { id: 'rock', labelKey: 'presetRock' },
  { id: 'jazz', labelKey: 'presetJazz' },
  { id: 'vocal', labelKey: 'presetVocal' },
  { id: 'electronic', labelKey: 'presetElectronic' },
];

/**
 * کامپوننت گرافیکی اکولایزر ۵ بانده و تقویت بیس
 * کاملاً واکنش‌گرا (ریسپانسیو) در موبایل و دسکتاپ
 */
export const EqualizerControl: React.FC<EqualizerControlProps> = ({
  settings,
  onChange,
  theme,
  t,
}) => {
  const { enabled, preset, bands, bassBoost } = settings;

  /** تغییر وضعیت فعال/غیرفعال بودن اکولایزر */
  const handleToggleEnabled = () => {
    onChange({
      ...settings,
      enabled: !enabled,
    });
  };

  /** انتخاب پریست آماده */
  const handleSelectPreset = (pId: EqualizerPreset) => {
    const p = EQ_PRESETS[pId];
    onChange({
      ...settings,
      preset: pId,
      bands: [...p.bands],
      bassBoost: p.bassBoost,
    });
  };

  /** تغییر یکی از باندهای فرکانسی */
  const handleBandChange = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index] = value;
    onChange({
      ...settings,
      preset: 'custom',
      bands: newBands,
    });
  };

  /** تغییر میزان تقویت بیس */
  const handleBassBoostChange = (value: number) => {
    onChange({
      ...settings,
      preset: 'custom',
      bassBoost: value,
    });
  };

  return (
    <div
      style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${theme.colors.border}`,
        boxSizing: 'border-box',
      }}
    >
      {/* سربرگ اکولایزر با کلید فعال‌سازی */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: enabled ? '20px' : '0',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Sliders size={22} color={theme.colors.primary} />
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.colors.textPrimary,
              }}
            >
              {t.equalizer || 'اکولایزر و تقویت صدا'}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: theme.colors.textSecondary,
                marginTop: '2px',
              }}
            >
              {t.equalizerDesc || 'تنظیم فرکانس‌های صوتی و تقویت بیس'}
            </div>
          </div>
        </div>

        {/* سوییچ روشن/خاموش iOS-style */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggleEnabled}
          style={{
            position: 'relative',
            width: '48px',
            height: '28px',
            borderRadius: '14px',
            backgroundColor: enabled ? theme.colors.primary : theme.colors.border,
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.25s',
            padding: 0,
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: enabled ? '23px' : '3px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
              transition: 'left 0.25s',
            }}
          />
        </button>
      </div>

      {/* محتوای اکولایزر در صورت فعال بودن */}
      {enabled && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'fadeIn 0.25s ease-in-out',
          }}
        >
          {/* لیست پریست‌ها */}
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: theme.colors.textSecondary,
                marginBottom: '10px',
              }}
            >
              {t.presets || 'پریست‌های صوتی'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {PRESET_KEYS.map((item) => {
                const isActive = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: theme.radius.sm,
                      border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.background,
                      color: isActive ? '#ffffff' : theme.colors.textPrimary,
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t[item.labelKey] || item.id}
                  </button>
                );
              })}

              {preset === 'custom' && (
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.primary}`,
                    color: theme.colors.primary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  {t.presetCustom || 'سفارشی'}
                </span>
              )}
            </div>
          </div>

          {/* اسلایدر تقویت بیس (Bass Boost) */}
          <div
            style={{
              backgroundColor: theme.colors.background,
              padding: '14px 18px',
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color={theme.colors.primary} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.textPrimary,
                  }}
                >
                  {t.bassBoost || 'تقویت بیس (Bass Boost)'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: bassBoost > 0 ? theme.colors.primary : theme.colors.textSecondary,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{bassBoost} {t.db || 'dB'}
              </span>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '24px', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '6px',
                  backgroundColor: theme.colors.surface,
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(bassBoost / 12) * 100}%`,
                    height: '100%',
                    backgroundColor: theme.colors.primary,
                    borderRadius: '3px',
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={bassBoost}
                onChange={(e) => handleBassBoostChange(Number(e.target.value))}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              />
            </div>
          </div>

          {/* ۵ باند فرکانسی گرافیکی */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <Volume2 size={16} color={theme.colors.primary} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: theme.colors.textSecondary,
                }}
              >
                فرکانس‌های ۵ گانه (-12 تا +12 دسی‌بل)
              </span>
            </div>

            {/* گرید اسلایدرهای فرکانس (ریسپانسیو در موبایل و دسکتاپ) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                backgroundColor: theme.colors.background,
                padding: '16px 8px',
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {EQ_BAND_LABELS.map((label, index) => {
                const gain = bands[index] ?? 0;
                // محاسبه درصد پر شدن نوار عمودی (بین -12 و +12)
                const percent = Math.min(100, Math.max(0, ((gain + 12) / 24) * 100));

                return (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {/* برچسب دسی‌بل بالای ستون */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: gain !== 0 ? theme.colors.primary : theme.colors.textSecondary,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {gain > 0 ? `+${gain}` : gain}
                    </span>

                    {/* ستون اسلایدر عمودی */}
                    <div
                      style={{
                        position: 'relative',
                        width: '32px',
                        height: '110px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* خط میانی صفر دسی‌بل */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '4px',
                          right: '4px',
                          height: '1px',
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          zIndex: 1,
                        }}
                      />

                      {/* پس‌زمینه مسیر اسلایدر */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          bottom: '10px',
                          width: '6px',
                          backgroundColor: theme.colors.surface,
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${percent}%`,
                            backgroundColor: theme.colors.primary,
                            borderRadius: '3px',
                          }}
                        />
                      </div>

                      {/* نقطه نشانگر اسلایدر */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `calc(${percent}% * 0.8 + 6px)`,
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                          pointerEvents: 'none',
                          zIndex: 3,
                        }}
                      />

                      {/* اینپوت رنج چرخانده‌شده به صورت عمودی */}
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={gain}
                        onChange={(e) => handleBandChange(index, Number(e.target.value))}
                        style={{
                          position: 'absolute',
                          width: '90px',
                          height: '32px',
                          transform: 'rotate(-90deg)',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 4,
                          margin: 0,
                        }}
                      />
                    </div>

                    {/* برچسب فرکانس زیر ستون */}
                    <span
                      style={{
                        fontSize: '11px',
                        color: theme.colors.textSecondary,
                        fontWeight: '500',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
