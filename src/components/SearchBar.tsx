import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  theme: any; // # اضافه شد
}

export const SearchBar = ({ onSearch, placeholder, theme }: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [value, setValue] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setValue('');
      onSearch('');
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={searchRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row-reverse', height: '40px', position: 'relative' }}>
      <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, backgroundColor: isOpen ? theme.colors.background : 'transparent', borderRadius: theme.radius.md }} onClick={() => isOpen ? handleClose() : setIsOpen(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ color: isOpen ? theme.colors.textPrimary : theme.colors.textSecondary }}>
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', width: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0, overflow: 'hidden', transition: 'width 0.3s ease, opacity 0.3s ease', animation: isClosing ? 'fadeOutScale 0.2s ease-in forwards' : 'none' }}>
        <style>{`@keyframes fadeOutScale { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }`}</style>
        <input type="text" placeholder={placeholder || "..."} value={value} onChange={(e) => { setValue(e.target.value); onSearch(e.target.value); }} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', width: '100%', fontSize: '14px', color: theme.colors.textPrimary, padding: '0 10px' }} />
        {isOpen && <X size={16} color={theme.colors.textSecondary} style={{ cursor: 'pointer', flexShrink: 0, transition: 'transform 0.2s', marginLeft: '5px' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} onClick={handleClose} />}
      </div>
    </div>
  );
};