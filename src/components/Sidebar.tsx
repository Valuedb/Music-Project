// import { Home as HomeIcon, Music, ListMusic, Menu, X } from 'lucide-react';
// import { theme } from '../theme';

// interface SidebarProps {
//   currentTab: string;
//   setCurrentTab: (tab: 'home' | 'allSongs' | 'playlists' | 'settings') => void;
//   t: any;
//   isCollapsed: boolean;
//   setIsCollapsed: (val: boolean) => void;
//   isMobile: boolean;
//   isDrawerOpen: boolean;
//   setIsDrawerOpen: (val: boolean) => void;
// }

// export const Sidebar = ({ currentTab, setCurrentTab, t, isCollapsed, setIsCollapsed, isMobile, isDrawerOpen, setIsDrawerOpen }: SidebarProps) => {
//   const menuItems = [
//     { id: 'home', label: t.home, icon: HomeIcon },
//     { id: 'allSongs', label: t.allSongs, icon: Music },
//     { id: 'playlists', label: t.playlists, icon: ListMusic },
//   ];

//   return (
//     <div style={{ 
//       width: isMobile ? '260px' : (isCollapsed ? '80px' : '260px'), 
//       height: '100vh', 
//       backgroundColor: theme.colors.surface, 
//       padding: '24px 16px', 
//       display: 'flex', 
//       flexDirection: 'column', 
//       gap: '8px', 
//       borderRight: `1px solid ${theme.colors.border}`,
//       transition: 'width 0.3s ease, transform 0.3s ease',
//       position: isMobile ? 'fixed' : 'relative',
//       left: 0, top: 0, zIndex: 200,
//       transform: isMobile ? (isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
//       overflow: 'hidden'
//     }}>
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', width: '100%' }}>
//         {(!isCollapsed || isMobile) && (
//           <h2 style={{ fontSize: '22px', fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: '-0.5px' }}>
//             Apple Music
//           </h2>
//         )}
//         <button 
//           onClick={() => isMobile ? setIsDrawerOpen(false) : setIsCollapsed(!isCollapsed)}
//           style={{ 
//             background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textSecondary,
//             display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px',
//             transition: 'transform 0.2s ease'
//           }}
//           onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
//           onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
//         >
//           {isMobile ? <X size={22} /> : <Menu size={22} />}
//         </button>
//       </div>
      
//       {menuItems.map((item) => (
//         <div 
//           key={item.id} 
//           onClick={() => {
//             setCurrentTab(item.id as any);
//             if (isMobile) setIsDrawerOpen(false);
//           }}
//           style={{ 
//             display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', 
//             color: currentTab === item.id ? theme.colors.primary : theme.colors.textSecondary, 
//             fontWeight: currentTab === item.id ? '600' : '400', 
//             padding: '10px 12px', borderRadius: theme.radius.md, 
//             backgroundColor: currentTab === item.id ? 'rgba(0, 122, 255, 0.1)' : 'transparent', 
//             transition: 'all 0.2s ease',
//             justifyContent: (!isCollapsed && !isMobile) ? 'flex-start' : 'center',
//             whiteSpace: 'nowrap'
//           }}
//         >
//           <item.icon size={22} />
//           {(!isCollapsed || isMobile) && <span style={{ fontSize: '15px' }}>{item.label}</span>}
//         </div>
//       ))}

//       {/* # دکمه تنظیمات با SVG سفارشی */}
//       <div 
//         onClick={() => {
//           setCurrentTab('settings');
//           if (isMobile) setIsDrawerOpen(false);
//         }}
//         style={{ 
//           marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', 
//           color: currentTab === 'settings' ? theme.colors.primary : theme.colors.textSecondary, 
//           fontWeight: currentTab === 'settings' ? '600' : '400', 
//           padding: '10px 12px', borderRadius: theme.radius.md, transition: 'all 0.2s ease',
//           justifyContent: (!isCollapsed && !isMobile) ? 'flex-start' : 'center',
//           whiteSpace: 'nowrap'
//         }}
//       >
//         {/* # این همون SVG هست که فرستادی */}
//         <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
//           <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
//         </svg>
//         {(!isCollapsed || isMobile) && <span style={{ fontSize: '15px' }}>{t.settings}</span>}
//       </div>
//     </div>
//   );
// };