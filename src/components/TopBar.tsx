import { Settings } from 'lucide-react';
import { SearchBar } from './SearchBar';

interface TopBarProps {
  currentTab: string;
  setCurrentTab: (tab: 'home' | 'allSongs' | 'playlists' | 'settings') => void;
  t: any;
  onSearch: (term: string) => void;
  theme: any;
}

export const TopBar = ({ currentTab, setCurrentTab, t, onSearch, theme }: TopBarProps) => {
  const menuItems = [
    { id: 'home', label: t.home },
    { id: 'allSongs', label: t.allSongs },
    { id: 'playlists', label: t.playlists },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'sticky', top: 0, zIndex: 50, paddingTop: '20px', paddingBottom: '10px', backgroundColor: 'transparent' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', marginBottom: '15px', width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.textPrimary, margin: 0 }}>Apple Music</h1>
        
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <SearchBar onSearch={onSearch} placeholder={t.search} theme={theme} />
          <Settings 
            size={22} 
            style={{ cursor: 'pointer', color: currentTab === 'settings' ? theme.colors.primary : theme.colors.textSecondary, transition: 'transform 0.2s' }} 
            onClick={() => setCurrentTab('settings')} 
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} 
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '20px', padding: '0 24px', boxSizing: 'border-box' }}>
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id} onClick={() => setCurrentTab(item.id as any)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer', 
                fontSize: isActive ? '18px' : '15px', 
                fontWeight: isActive ? '800' : '500',
                color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                padding: '10px 5px', 
                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)', 
                whiteSpace: 'nowrap',
                transform: isActive ? 'scale(1.1)' : 'scale(0.9)', 
                opacity: isActive ? 1 : 0.6, 
                filter: isActive ? 'none' : 'blur(2px)', 
                zIndex: isActive ? 2 : 1
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};