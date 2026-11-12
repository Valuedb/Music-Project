import { useEffect, useRef } from 'react';

export interface DesktopShortcutActions {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekBy: (deltaSeconds: number) => void;
  onVolumeBy: (deltaVolume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavoriteCurrent: () => void;
  onToggleQueue: () => void;
  onToggleFullScreen: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onSelectTabIndex: (index: number) => void;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
};

/**
 * میانبرهای کیبورد استاندارد دسکتاپ ویندوز (بدون هیچ تغییری در ظاهر برنامه):
 * Space / MediaPlayPause: پخش/توقف | Ctrl+Left/Right: قبلی/بعدی | Left/Right: جلو/عقب ۵ ثانیه
 * Ctrl+Up/Down یا +/-: کنترل صدا | M: بی‌صدا | S: شافل | R: تکرار | L: محبوب | Q: صف | F: تمام‌صفحه
 * Ctrl+F: جستجو | Ctrl+,: تنظیمات | Alt+1..6: جابه‌جایی بین تب‌ها
 */
export const useKeyboardShortcuts = (actions: DesktopShortcutActions) => {
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // کلیدهای سخت‌افزاری مدیا همیشه عمل کنند
      if (e.key === 'MediaPlayPause') {
        e.preventDefault();
        actionsRef.current.onTogglePlay();
        return;
      }
      if (e.key === 'MediaTrackNext') {
        e.preventDefault();
        actionsRef.current.onNext();
        return;
      }
      if (e.key === 'MediaTrackPrevious') {
        e.preventDefault();
        actionsRef.current.onPrev();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const lower = e.key.toLowerCase();
        if (lower === 'f') {
          e.preventDefault();
          actionsRef.current.onOpenSearch();
          return;
        }
        if (e.key === ',') {
          e.preventDefault();
          actionsRef.current.onOpenSettings();
          return;
        }
      }

      if (isEditableTarget(e.target)) return;

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = Number(e.key);
        if (num >= 1 && num <= 6) {
          e.preventDefault();
          actionsRef.current.onSelectTabIndex(num - 1);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          actionsRef.current.onNext();
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          actionsRef.current.onPrev();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          actionsRef.current.onVolumeBy(0.05);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          actionsRef.current.onVolumeBy(-0.05);
          return;
        }
        return;
      }

      if (e.altKey) return;

      const lower = e.key.toLowerCase();

      if (e.code === 'Space' || lower === 'k') {
        e.preventDefault();
        actionsRef.current.onTogglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        actionsRef.current.onSeekBy(e.shiftKey ? 15 : 5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        actionsRef.current.onSeekBy(e.shiftKey ? -15 : -5);
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        actionsRef.current.onVolumeBy(0.05);
      } else if (e.key === '-') {
        e.preventDefault();
        actionsRef.current.onVolumeBy(-0.05);
      } else if (lower === 'm') {
        e.preventDefault();
        actionsRef.current.onToggleMute();
      } else if (lower === 's') {
        e.preventDefault();
        actionsRef.current.onToggleShuffle();
      } else if (lower === 'r') {
        e.preventDefault();
        actionsRef.current.onCycleRepeat();
      } else if (lower === 'l') {
        e.preventDefault();
        actionsRef.current.onToggleFavoriteCurrent();
      } else if (lower === 'q') {
        e.preventDefault();
        actionsRef.current.onToggleQueue();
      } else if (lower === 'f') {
        e.preventDefault();
        actionsRef.current.onToggleFullScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
