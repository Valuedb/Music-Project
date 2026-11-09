import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { SearchBar } from './SearchBar';

interface TopBarProps {
  currentTab: string;
  setCurrentTab: (tab: 'home' | 'allSongs' | 'playlists' | 'settings') => void;
  t: any;
  onSearch: (term: string) => void;
  theme: any;
}

// استخراج ایمن مقدار translateX از استایل کامپیوترشده برای سازگاری با تمامی مرورگرها در RTL و LTR
const getTranslateX = (el: HTMLElement): number => {
  const transform = window.getComputedStyle(el).transform;
  if (!transform || transform === 'none') return 0;
  if (typeof DOMMatrixReadOnly !== 'undefined') {
    try {
      return new DOMMatrixReadOnly(transform).m41;
    } catch {
      // fallback
    }
  }
  if (typeof (window as any).WebKitCSSMatrix !== 'undefined') {
    try {
      return new (window as any).WebKitCSSMatrix(transform).m41;
    } catch {
      // fallback
    }
  }
  const match = transform.match(/matrix.*\((.+)\)/);
  if (match) {
    const values = match[1].split(',').map((v) => parseFloat(v.trim()));
    return values.length === 6 ? values[4] : values.length === 16 ? values[12] : 0;
  }
  return 0;
};

export const TopBar = ({ currentTab, setCurrentTab, t, onSearch, theme }: TopBarProps) => {
  const menuItems = useMemo(
    () => [
      { id: 'home', label: t.home },
      { id: 'allSongs', label: t.allSongs },
      { id: 'playlists', label: t.playlists },
    ],
    [t.home, t.allSongs, t.playlists]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [trackX, setTrackX] = useState(0);

  // محاسبه و تنظیم دقیق موقعیت ترک تب‌ها تا تب فعال در هر جهت و زبان (فارسی RTL یا انگلیسی LTR) دقیقاً در مرکز افقی صفحه قرار گیرد
  const centerActiveTab = useCallback(() => {
    const activeIndex = menuItems.findIndex((item) => item.id === currentTab);
    if (activeIndex === -1) return;
    const activeEl = tabRefs.current[activeIndex];
    const container = containerRef.current;
    const track = trackRef.current;
    if (!activeEl || !container || !track) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    const containerCenter = containerRect.left + containerRect.width / 2;
    const activeCenter = activeRect.left + activeRect.width / 2;

    const currentX = getTranslateX(track);
    const delta = containerCenter - activeCenter;

    // اگر اختلاف کمتر از 0.5 پیکسل باشد تغییری نمی‌دهیم تا چرخه اضافه ایجاد نشود
    if (Math.abs(delta) < 0.5) return;

    setTrackX(currentX + delta);
  }, [currentTab, menuItems]);

  useEffect(() => {
    centerActiveTab();
    const rafId = requestAnimationFrame(centerActiveTab);
    const timer = setTimeout(centerActiveTab, 60);
    const onResize = () => centerActiveTab();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [centerActiveTab]);

  const hoverBg = theme.colors.surfaceHover || 'rgba(255, 255, 255, 0.08)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        paddingTop: '18px',
        paddingBottom: '8px',
        backgroundColor: theme.isDark ? 'rgba(12, 10, 24, 0.72)' : 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderBottom: `1px solid ${theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* هدر بالایی با عنوان اپل موزیک و دکمه‌های جستجو و تنظیمات */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          marginBottom: '10px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '800',
            letterSpacing: '-0.4px',
            color: theme.colors.textPrimary,
            margin: 0,
          }}
        >
          Apple Music
        </h1>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <SearchBar onSearch={onSearch} placeholder={t.search} theme={theme} />
          <button
            onClick={() => setCurrentTab('settings')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: currentTab === 'settings' ? theme.colors.primary : theme.colors.textSecondary,
              borderRadius: theme.radius?.md || '10px',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            title={t.settings}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
              e.currentTarget.style.color = theme.colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = currentTab === 'settings' ? theme.colors.primary : theme.colors.textSecondary;
            }}
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* کاروسل تب‌های سنترشده با افکت بلوری عمق میدان (Cover-Flow Tab Carousel) */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box',
          minHeight: '48px',
        }}
      >
        <motion.div
          ref={trackRef}
          animate={{ x: trackX }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 34,
            mass: 0.8,
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '14px',
            position: 'relative',
            whiteSpace: 'nowrap',
          }}
        >
          {menuItems.map((item, index) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                onClick={() => setCurrentTab(item.id as any)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 8px 4px 8px',
                  fontSize: '16px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  userSelect: 'none',
                  transform: isActive ? 'scale(1.12)' : 'scale(0.88)',
                  opacity: isActive ? 1 : 0.45,
                  filter: isActive ? 'none' : 'blur(2px)',
                  zIndex: isActive ? 2 : 1,
                  transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease, filter 0.35s ease, color 0.35s ease',
                }}
              >
                <span style={{ lineHeight: '1.2' }}>{item.label}</span>

                {/* نشانگر ظریف کپسولی متحرک زیر تب فعال */}
                <div
                  style={{
                    height: '4px',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCenteredTabPill"
                      style={{
                        width: '22px',
                        height: '3px',
                        borderRadius: '3px',
                        backgroundColor: theme.colors.primary,
                        boxShadow: `0 2px 8px ${theme.colors.primary}77`,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};