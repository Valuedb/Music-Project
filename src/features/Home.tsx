import { useState } from 'react';
import { Clock, Flame, X, Play, ArrowLeft } from 'lucide-react';
import type { Song } from '../types';

interface HomeProps {
  songs: Song[];
  onPlaySongFromList: (song: Song, list: Song[]) => void;
  t: any;
  theme: any;
}

/** رندر یک ردیف آهنگ در لیست باز‌شده (با شماره، کاور، نام، آرتیست و تعداد پخش) */
const SongRow = ({ song, index, onPlay, theme, t }: {
  song: Song;
  index: number;
  onPlay: () => void;
  theme: any;
  t: any;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '12px 15px',
        borderBottom: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        borderRadius: theme.radius.md,
        transition: 'all 0.2s ease',
        backgroundColor: hovered ? theme.colors.surface : 'transparent',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      <span
        style={{
          color: theme.colors.textSecondary,
          width: '25px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {index + 1}
      </span>

      <img
        src={song.cover}
        alt=""
        style={{
          width: '50px',
          height: '50px',
          borderRadius: theme.radius.sm,
          objectFit: 'cover',
          boxShadow: theme.shadows.soft,
        }}
      />

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: '600',
            color: theme.colors.textPrimary,
            fontSize: '16px',
          }}
        >
          {song.name}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: theme.colors.textSecondary,
            marginTop: '2px',
          }}
        >
          {song.artist}
        </div>
      </div>

      <div
        style={{
          fontSize: '13px',
          color: theme.colors.textSecondary,
          marginRight: '15px',
        }}
      >
        {song.playCount} {t.plays}
      </div>

      <div
        style={{
          backgroundColor: 'rgba(0,122,255,0.1)',
          padding: '8px',
          borderRadius: '50%',
        }}
      >
        <Play size={16} fill={theme.colors.primary} color={theme.colors.primary} />
      </div>
    </div>
  );
};

/** نمایش کاور کوچک یک آهنگ با دکمه Play که در حالت hover ظاهر می‌شود */
const SongCover = ({ song, theme }: { song: Song; theme: any }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <img
        src={song.cover}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: theme.radius.md,
          objectFit: 'cover',
          boxShadow: theme.shadows.soft,
        }}
      />
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: theme.radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        <Play size={24} fill="#fff" color="#fff" />
      </div>
    </div>
  );
};

/** کارت قابل‌کلیک برای نمایش پیش‌نمایش یک لیست (اخیراً اضافه‌شده / پربازدیدترین) */
const ListCard = ({ title, icon, list, onClick, theme }: {
  title: string;
  icon: React.ReactNode;
  list: Song[];
  onClick: () => void;
  theme: any;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        minWidth: '300px',
        backgroundColor: theme.colors.surface,
        backdropFilter: 'blur(10px)',
        borderRadius: theme.radius.lg,
        padding: '25px',
        border: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? theme.shadows.hard : theme.shadows.soft,
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: theme.colors.primary,
          marginBottom: '20px',
        }}
      >
        {icon}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: theme.colors.textPrimary,
          }}
        >
          {title}
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '15px',
          overflowX: 'auto',
          paddingBottom: '10px',
        }}
      >
        {list.slice(0, 5).map((song) => (
          <SongCover key={song.id} song={song} theme={theme} />
        ))}
      </div>
    </div>
  );
};

export const Home = ({ songs, onPlaySongFromList, t, theme }: HomeProps) => {
  const [activeList, setActiveList] = useState<'recent' | 'mostPlayed' | null>(null);

  // مرتب‌سازی آهنگ‌ها بر اساس تاریخ اضافه‌شدن (جدیدترین اول)
  const recentlyAdded = [...songs].sort((a, b) => b.addedAt - a.addedAt);

  // مرتب‌سازی آهنگ‌ها بر اساس تعداد پخش (پربازدیدترین اول)
  const mostPlayed = [...songs].sort((a, b) => b.playCount - a.playCount);

  // نمایش لیست کامل یک دسته (اخیر یا پربازدید) با امکان بازگشت به خانه
  if (activeList) {
    const list = activeList === 'recent' ? recentlyAdded : mostPlayed;
    const title = activeList === 'recent' ? t.recentlyAdded : t.mostPlayed;

    return (
      <div
        style={{
          flex: 1,
          padding: '40px',
          paddingBottom: '130px',
          overflowY: 'auto',
        }}
      >
        <style>{`@keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }`}</style>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <button
            onClick={() => setActiveList(null)}
            style={{
              background: theme.colors.surface,
              border: 'none',
              color: theme.colors.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: 'bold',
              padding: '10px 15px',
              borderRadius: theme.radius.xl,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-5px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
          >
            <ArrowLeft size={18} /> {t.back}
          </button>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: theme.colors.textPrimary,
            }}
          >
            {title}
          </h1>
        </div>

        <div style={{ maxWidth: '800px' }}>
          {list.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              onPlay={() => onPlaySongFromList(song, list)}
              theme={theme}
              t={t}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      <h1
        style={{
          fontSize: '36px',
          fontWeight: '800',
          marginBottom: '40px',
          color: theme.colors.textPrimary,
          letterSpacing: '-1px',
        }}
      >
        {t.listenNow}
      </h1>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <ListCard
          title={t.recentlyAdded}
          icon={<Clock size={26} />}
          list={recentlyAdded}
          onClick={() => setActiveList('recent')}
          theme={theme}
        />
        <ListCard
          title={t.mostPlayed}
          icon={<Flame size={26} />}
          list={mostPlayed}
          onClick={() => setActiveList('mostPlayed')}
          theme={theme}
        />
      </div>
    </div>
  );
};