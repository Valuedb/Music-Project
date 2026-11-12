import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RotateCcw } from 'lucide-react';
import type { Song } from '../types';
import { CoverImage } from './CoverImage';

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSave: (updatedSong: Song) => void;
  theme: any;
  t: any;
}

/**
 * مودال ویرایش تگ‌ها و کاور آهنگ
 * امکان بارگذاری مستقیم تصویر کاور از فایل‌های دستگاه و ویرایش متادیتا
 */
export const EditSongModal: React.FC<EditSongModalProps> = ({
  isOpen,
  onClose,
  song,
  onSave,
  theme,
  t,
}) => {
  const [formData, setFormData] = useState<Partial<Song>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** پر کردن مقادیر اولیه فرم هنگام باز شدن مودال */
  useEffect(() => {
    if (isOpen && song) {
      setImageError(null);
      setFormData({
        name: song.name || '',
        artist: song.artist || '',
        album: song.album || '',
        folder: song.folder || '',
        year: song.year || '',
        cover: song.cover || '',
      });
    }
  }, [isOpen, song]);

  /** تغییر تصویر کاور با انتخاب فایل از گالری یا سیستم */
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError(t.imageFileError || 'لطفاً یک فایل تصویری معتبر انتخاب کنید.');
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, cover: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  /** بازنشانی کاور به کاور اصلی آهنگ */
  const handleResetCover = () => {
    if (song) {
      setFormData((prev) => ({ ...prev, cover: song.cover }));
    }
  };

  /** ذخیره تغییرات و بستن مودال */
  const handleSave = () => {
    if (song) {
      const updated: Song = {
        ...song,
        name: (formData.name || '').trim() || song.name,
        artist: (formData.artist || '').trim() || song.artist,
        album: (formData.album || '').trim() || song.album,
        folder: (formData.folder || '').trim() || undefined,
        year: (formData.year || '').trim() || song.year,
        cover: formData.cover || song.cover,
      };
      onSave(updated);
    }
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && song && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              padding: '24px 20px',
              borderRadius: theme.radius.lg,
              width: '100%',
              maxWidth: '440px',
              maxHeight: '88vh',
              overflowY: 'auto',
              border: `1px solid ${theme.colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* هدر مودال */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button onClick={onClose} style={btnSecondaryStyle(theme)}>
                {t.cancel}
              </button>

              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  color: theme.colors.textPrimary,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                {t.editSong || 'ویرایش اطلاعات آهنگ'}
              </h2>

              <button onClick={handleSave} style={btnPrimaryStyle(theme)}>
                {t.save || 'ذخیره'}
              </button>
            </div>

            {/* بخش ویرایش و پیش‌نمایش کاور */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 0 6px 0',
              }}
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                title={t.changeCover || 'تغییر کاور'}
                style={{
                  position: 'relative',
                  width: '130px',
                  height: '130px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: `2px solid ${theme.colors.border}`,
                  boxShadow: theme.shadows.medium,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CoverImage
                  src={formData.cover}
                  alt=""
                  iconSize={42}
                  iconColor={theme.colors.textSecondary}
                  fallbackBg="rgba(0,0,0,0.2)"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* لایه هاور دوربین */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    color: '#ffffff',
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Camera size={26} />
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>
                    {t.changeCover || 'تغییر کاور'}
                  </span>
                </div>
              </div>

              {/* ورودی مخفی انتخاب فایل تصویر */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    ...btnSecondaryStyle(theme),
                    fontSize: '12px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Camera size={14} />
                  <span>{t.uploadFromDevice || 'انتخاب عکس'}</span>
                </button>

                {formData.cover !== song.cover && (
                  <button
                    type="button"
                    onClick={handleResetCover}
                    style={{
                      ...btnSecondaryStyle(theme),
                      fontSize: '12px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: theme.colors.textSecondary,
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>{t.resetCover || 'بازنشانی'}</span>
                  </button>
                )}
              </div>
              {imageError && (
                <div style={{ fontSize: '12px', color: theme.colors.danger || '#ff453a', textAlign: 'center' }}>
                  {imageError}
                </div>
              )}
            </div>

            {/* فرم فیلدهای متادیتا */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle(theme)}>{t.songName || 'نام آهنگ'}</label>
                <input
                  type="text"
                  placeholder={t.songName || 'نام آهنگ'}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle(theme)}
                />
              </div>

              <div>
                <label style={labelStyle(theme)}>{t.artist || 'خواننده'}</label>
                <input
                  type="text"
                  placeholder={t.artist || 'خواننده'}
                  value={formData.artist || ''}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  style={inputStyle(theme)}
                />
              </div>

              <div>
                <label style={labelStyle(theme)}>{t.album || 'آلبوم'}</label>
                <input
                  type="text"
                  placeholder={t.album || 'آلبوم'}
                  value={formData.album || ''}
                  onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                  style={inputStyle(theme)}
                />
              </div>

              <div>
                <label style={labelStyle(theme)}>{t.folder || 'فولدر'}</label>
                <input
                  type="text"
                  placeholder={t.folderPlaceholder || 'مثال: راک / منتخب'}
                  value={formData.folder || ''}
                  onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                  style={inputStyle(theme)}
                />
              </div>

              <div>
                <label style={labelStyle(theme)}>{t.year || 'سال انتشار'}</label>
                <input
                  type="text"
                  placeholder={t.year || 'سال انتشار'}
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  style={inputStyle(theme)}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const labelStyle = (theme: any) => ({
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  marginBottom: '4px',
  color: theme.colors.textSecondary,
});

const inputStyle = (theme: any) => ({
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 14px',
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.border}`,
  backgroundColor: theme.colors.background,
  color: theme.colors.textPrimary,
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
});

const btnPrimaryStyle = (theme: any) => ({
  padding: '8px 18px',
  borderRadius: theme.radius.sm,
  border: 'none',
  backgroundColor: theme.colors.primary,
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
  transition: 'opacity 0.2s',
});

const btnSecondaryStyle = (theme: any) => ({
  padding: '8px 14px',
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.colors.border}`,
  backgroundColor: 'transparent',
  color: theme.colors.textPrimary,
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '14px',
  transition: 'background-color 0.2s',
});