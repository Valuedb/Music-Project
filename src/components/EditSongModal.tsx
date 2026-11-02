import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Song } from '../App';

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSave: (updatedSong: Song) => void;
  theme: any;
  t: any;
}

export const EditSongModal = ({
  isOpen,
  onClose,
  song,
  onSave,
  theme,
  t,
}: EditSongModalProps) => {
  const [formData, setFormData] = useState<Partial<Song>>({});

  /** پر کردن مقادیر اولیه فرم هنگام باز شدن مودال */
  useEffect(() => {
    if (isOpen && song) {
      setFormData({
        name: song.name || '',
        artist: song.artist || '',
        album: song.album || '',
        year: song.year || '',
        cover: song.cover || '',
      });
    }
  }, [isOpen, song]);

  /** ذخیره تغییرات و بستن مودال */
  const handleSave = () => {
    if (song) {
      onSave({ ...song, ...formData });
    }
    onClose();
  };

  return (
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
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.background,
              padding: 24,
              borderRadius: theme.radius.lg,
              width: '100%',
              maxWidth: 450,
              border: `1px solid ${theme.colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: theme.shadows.hard,
            }}
          >
            {/* هدر مودال: دکمه‌ها و عنوان */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <button
                onClick={onClose}
                style={btnStyle(theme, false)}
              >
                {t.cancel}
              </button>

              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: theme.colors.textPrimary,
                  fontWeight: 'bold',
                }}
              >
                {t.editSong || 'ویرایش آهنگ'}
              </h2>

              <button
                onClick={handleSave}
                style={btnStyle(theme, true)}
              >
                {t.save || 'ذخیره'}
              </button>
            </div>

            {/* فرم ویرایش */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <input
                type="text"
                placeholder={t.songName || 'نام آهنگ'}
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={inputStyle(theme)}
              />
              <input
                type="text"
                placeholder={t.artist || 'خواننده'}
                value={formData.artist || ''}
                onChange={(e) =>
                  setFormData({ ...formData, artist: e.target.value })
                }
                style={inputStyle(theme)}
              />
              <input
                type="text"
                placeholder={t.album || 'آلبوم'}
                value={formData.album || ''}
                onChange={(e) =>
                  setFormData({ ...formData, album: e.target.value })
                }
                style={inputStyle(theme)}
              />
              <input
                type="text"
                placeholder={t.year || 'سال انتشار'}
                value={formData.year || ''}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                style={inputStyle(theme)}
              />
              <input
                type="text"
                placeholder={t.coverUrl || 'آدرس تصویر کاور (URL)'}
                value={formData.cover || ''}
                onChange={(e) =>
                  setFormData({ ...formData, cover: e.target.value })
                }
                style={inputStyle(theme)}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** استایل مشترک برای اینپوت‌های فرم */
const inputStyle = (theme: any) => ({
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '12px 14px',
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.border}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.textPrimary,
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
});

/** استایل مشترک برای دکمه‌های مودال */
const btnStyle = (theme: any, primary: boolean) => ({
  padding: '8px 16px',
  borderRadius: theme.radius.sm,
  border: 'none',
  backgroundColor: primary
    ? theme.colors.primary
    : theme.colors.surface,
  color: primary ? '#fff' : theme.colors.textSecondary,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
});