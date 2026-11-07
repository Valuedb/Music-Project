import { memo } from 'react';
import { Trash2, Music } from 'lucide-react';
import type { Song } from '../../types';

interface QueueListProps {
  queue: Song[];
  onRemoveFromQueue: (index: number) => void;
  t: any;
  primaryColor?: string;
}

/**
 * لیست صف پخش (Up Next) در داخل صفحه تمام‌صفحه
 */
export const QueueList = memo(({
  queue,
  onRemoveFromQueue,
  t,
  primaryColor = '#0a84ff',
}: QueueListProps) => {
  if (queue.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '280px',
          color: 'rgba(255, 255, 255, 0.45)',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        <Music size={40} strokeWidth={1.5} />
        <span style={{ fontSize: '15px' }}>{t.queueEmpty || 'صف خالی است'}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '360px',
        overflowY: 'auto',
        padding: '8px 4px',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: primaryColor,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: '6px',
        }}
      >
        {t.queue} ({queue.length})
      </div>

      {queue.map((song, index) => (
        <div
          key={`${song.id}-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'background-color 0.2s',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.4)',
              width: '18px',
              textAlign: 'center',
            }}
          >
            {index + 1}
          </span>

          <img
            src={song.cover}
            alt=""
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              objectFit: 'cover',
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {song.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '1px',
              }}
            >
              {song.artist}
            </div>
          </div>

          <button
            onClick={() => onRemoveFromQueue(index)}
            title={t.deleteSong || 'Remove'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff453a';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
});

QueueList.displayName = 'QueueList';
