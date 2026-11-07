import React, { useState } from 'react';
import {
  Clock,
  Flame,
  History,
  Heart,
  Play,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import type { Song, Playlist } from '../types';
import { AllSongs } from './AllSongs';

// ================= اینترفیس پراپ‌ها =================

interface HomeProps {
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  onCreatePlaylist: (name: string, selectedSongs: Song[]) => void;
  addToQueue: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onUpdateSong: (updatedSong: Song) => void;
  onAddSongToPlaylist: (playlistId: string, song: Song) => void;
  onToggleFavorite: (id: string) => void;
  t: any;
  theme: any;
  language: 'fa' | 'en';
}

type ActiveCollection =
  | 'recentlyAdded'
  | 'mostPlayed'
  | 'recentlyPlayed'
  | 'favorites'
  | null;

// ================= کامپوننت کارت فشرده و مدرن =================

interface CollectionCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  songs: Song[];
  emptyText: string;
  onClick: () => void;
  onQuickPlay: () => void;
  theme: any;
  t: any;
  language: 'fa' | 'en';
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  title,
  count,
  icon,
  iconBg,
  iconColor,
  songs,
  emptyText,
  onClick,
  onQuickPlay,
  theme,
  t,
  language,
}) => {
  const [hovered, setHovered] = useState(false);
  const [playHovered, setPlayHovered] = useState(false);

  const previewSongs = songs.slice(0, 4);
  const hasSongs = songs.length > 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        border: `1px solid ${
          hovered ? theme.colors.primary + '55' : theme.colors.border
        }`,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 28px rgba(0, 0, 0, 0.25)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        boxSizing: 'border-box',
        minHeight: '145px',
      }}
    >
      {/* هدر کارت: آیکون، عنوان، تعداد و دکمه پخش سریع */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '700',
                color: theme.colors.textPrimary,
                lineHeight: 1.25,
              }}
            >
              {title}
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: theme.colors.textSecondary,
                marginTop: '2px',
                display: 'block',
              }}
            >
              {count} {t.tracksCount || 'آهنگ'}
            </span>
          </div>
        </div>

        {/* دکمه پخش سریع کالکشن با ۱ کلیک */}
        {hasSongs ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickPlay();
            }}
            onMouseEnter={() => setPlayHovered(true)}
            onMouseLeave={() => setPlayHovered(false)}
            title={t.playAll || 'پخش'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: theme.colors.primary,
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: playHovered
                ? `0 0 12px ${theme.colors.primary}`
                : '0 2px 8px rgba(0,0,0,0.2)',
              transform: playHovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <Play size={15} fill="#ffffff" />
          </button>
        ) : (
          <div
            style={{
              color: theme.colors.textSecondary,
              opacity: 0.6,
            }}
          >
            {language === 'fa' ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </div>
        )}
      </div>

      {/* بدنه کارت: پیش‌نمایش کاورهای کوچک فشرده */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {hasSongs ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {previewSongs.map((song, idx) => (
              <div
                key={song.id + idx}
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                }}
              >
                <img
                  src={song.cover}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            ))}

            {count > previewSongs.length && (
              <div
                style={{
                  height: '44px',
                  padding: '0 8px',
                  borderRadius: '8px',
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: theme.colors.textSecondary,
                  flexShrink: 0,
                }}
              >
                +{count - previewSongs.length}
              </div>
            )}
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: theme.colors.textSecondary,
              lineHeight: 1.4,
              opacity: 0.85,
            }}
          >
            {emptyText}
          </p>
        )}
      </div>

      {/* فوتر کارت: لینک مشاهده با فلش */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontWeight: '600',
          color: hovered ? theme.colors.primary : theme.colors.textSecondary,
          transition: 'color 0.2s',
          paddingTop: '2px',
        }}
      >
        <span>{t.viewAll || 'مشاهده همه'}</span>
        {language === 'fa' ? (
          <ChevronLeft
            size={15}
            style={{
              transform: hovered ? 'translateX(-3px)' : 'translateX(0)',
              transition: 'transform 0.2s',
            }}
          />
        ) : (
          <ChevronRight
            size={15}
            style={{
              transform: hovered ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.2s',
            }}
          />
        )}
      </div>
    </div>
  );
};

// ================= کامپوننت اصلی Home =================

export const Home: React.FC<HomeProps> = ({
  songs,
  playlists,
  currentSong,
  onPlaySongFromList,
  onCreatePlaylist,
  addToQueue,
  onDeleteSong,
  onUpdateSong,
  onAddSongToPlaylist,
  onToggleFavorite,
  t,
  theme,
  language,
}) => {
  const [activeList, setActiveList] = useState<ActiveCollection>(null);

  // 1. اخیراً اضافه شده (جدیدترین اول)
  const recentlyAdded = [...songs].sort((a, b) => b.addedAt - a.addedAt);

  // 2. پربازدیدترین‌ها / بیشترین پخش
  const mostPlayed = [...songs].sort(
    (a, b) => (b.playCount || 0) - (a.playCount || 0)
  );

  // 3. اخیراً پخش شده (آهنگ‌هایی که گوش داده شده‌اند بر اساس تاریخ آخرین پخش)
  const recentlyPlayed = [...songs]
    .filter(
      (s) =>
        (s.lastPlayedAt && s.lastPlayedAt > 0) ||
        (s.playCount && s.playCount > 0)
    )
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));

  // 4. آهنگ‌های محبوب (علامت‌گذاری شده با قلب)
  const favouriteSongs = songs.filter((s) => s.isFavorite === true);

  // ================= حالت نمایش تفصیلی کالکشن (یکپارچه با AllSongs) =================
  if (activeList) {
    const activeConfig = {
      recentlyAdded: {
        title: t.recentlyAdded || 'اخیراً اضافه شده',
        list: recentlyAdded,
        empty: t.noSongs || 'هیچ آهنگی وجود ندارد.',
      },
      mostPlayed: {
        title: t.mostPlayed || 'پرتکرارترین‌ها',
        list: mostPlayed,
        empty: t.noSongs || 'هنوز پخشی ثبت نشده است.',
      },
      recentlyPlayed: {
        title: t.recentlyPlayed || 'اخیراً پخش شده',
        list: recentlyPlayed,
        empty: t.noRecentlyPlayed || 'هنوز هیچ آهنگی پخش نشده است.',
      },
      favorites: {
        title: t.favouriteSongs || 'آهنگ‌های محبوب',
        list: favouriteSongs,
        empty:
          t.noFavorites ||
          'هنوز آهنگی به عنوان محبوب علامت‌گذاری نشده است.',
      },
    }[activeList];

    return (
      <AllSongs
        songs={activeConfig.list}
        playlists={playlists}
        currentSong={currentSong}
        onPlaySongFromList={onPlaySongFromList}
        onCreatePlaylist={onCreatePlaylist}
        addToQueue={addToQueue}
        onDeleteSong={onDeleteSong}
        onUpdateSong={onUpdateSong}
        onAddSongToPlaylist={onAddSongToPlaylist}
        onToggleFavorite={onToggleFavorite}
        t={t}
        theme={theme}
        title={activeConfig.title}
        onBack={() => setActiveList(null)}
        emptyMessage={activeConfig.empty}
      />
    );
  }

  // ================= نمای صفحه خانه با ۴ باکس فشرده و مدرن =================
  return (
    <div
      style={{
        flex: 1,
        padding: 'clamp(16px, 3vw, 32px) clamp(16px, 4vw, 40px) 130px',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* تیتر صفحه خانه */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(18px, 2.5vw, 28px)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: '800',
              color: theme.colors.textPrimary,
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            {t.listenNow || 'همین حالا گوش کن'}
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: theme.colors.textSecondary,
            }}
          >
            {songs.length} {t.tracksCount || 'آهنگ'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: theme.colors.primary,
            fontWeight: '600',
          }}
        >
          <Sparkles size={16} />
        </div>
      </div>

      {/* شبکه ۲×۲ باکس‌های مدرن و فشرده */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(clamp(240px, 45vw, 320px), 1fr))',
          gap: 'clamp(12px, 2vw, 20px)',
        }}
      >
        {/* ۱. اخیراً اضافه شده */}
        <CollectionCard
          title={t.recentlyAdded || 'اخیراً اضافه شده'}
          count={recentlyAdded.length}
          icon={<Clock size={18} />}
          iconBg="rgba(10, 132, 255, 0.15)"
          iconColor="#0a84ff"
          songs={recentlyAdded}
          emptyText={t.noSongs || 'آهنگی موجود نیست'}
          onClick={() => setActiveList('recentlyAdded')}
          onQuickPlay={() =>
            recentlyAdded.length > 0 &&
            onPlaySongFromList(recentlyAdded[0], recentlyAdded)
          }
          theme={theme}
          t={t}
          language={language}
        />

        {/* ۲. پربازدیدترین‌ها */}
        <CollectionCard
          title={t.mostPlayed || 'پرتکرارترین‌ها'}
          count={mostPlayed.length}
          icon={<Flame size={18} />}
          iconBg="rgba(255, 149, 0, 0.15)"
          iconColor="#ff9500"
          songs={mostPlayed}
          emptyText={t.noSongs || 'آهنگی موجود نیست'}
          onClick={() => setActiveList('mostPlayed')}
          onQuickPlay={() =>
            mostPlayed.length > 0 &&
            onPlaySongFromList(mostPlayed[0], mostPlayed)
          }
          theme={theme}
          t={t}
          language={language}
        />

        {/* ۳. اخیراً پخش شده */}
        <CollectionCard
          title={t.recentlyPlayed || 'اخیراً پخش شده'}
          count={recentlyPlayed.length}
          icon={<History size={18} />}
          iconBg="rgba(94, 92, 230, 0.15)"
          iconColor="#5e5ce6"
          songs={recentlyPlayed}
          emptyText={
            t.noRecentlyPlayed ||
            'با پخش آهنگ‌ها، تاریخچه در اینجا ثبت می‌شود'
          }
          onClick={() => setActiveList('recentlyPlayed')}
          onQuickPlay={() =>
            recentlyPlayed.length > 0 &&
            onPlaySongFromList(recentlyPlayed[0], recentlyPlayed)
          }
          theme={theme}
          t={t}
          language={language}
        />

        {/* ۴. آهنگ‌های محبوب */}
        <CollectionCard
          title={t.favouriteSongs || 'آهنگ‌های محبوب'}
          count={favouriteSongs.length}
          icon={<Heart size={18} fill="#ff3b30" />}
          iconBg="rgba(255, 59, 48, 0.15)"
          iconColor="#ff3b30"
          songs={favouriteSongs}
          emptyText={
            t.noFavorites ||
            'برای افزودن آهنگ به اینجا، روی آیکون قلب کلیک کنید'
          }
          onClick={() => setActiveList('favorites')}
          onQuickPlay={() =>
            favouriteSongs.length > 0 &&
            onPlaySongFromList(favouriteSongs[0], favouriteSongs)
          }
          theme={theme}
          t={t}
          language={language}
        />
      </div>
    </div>
  );
};