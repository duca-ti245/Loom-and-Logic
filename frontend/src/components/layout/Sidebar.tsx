import { Sparkles, Grid, Layers, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: 'canvas' | 'studio' | 'library';
  setActiveTab: (tab: 'canvas' | 'studio' | 'library') => void;
}

export function Sidebar({ isDarkMode, toggleDarkMode, activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'canvas', label: 'The Canvas', icon: Grid },
    { id: 'studio', label: 'Idea Studio', icon: Sparkles },
    { id: 'library', label: 'Detail Library', icon: Layers },
  ] as const;

  return (
    <div className="fixed top-0 left-0 h-full w-64 glass flex flex-col justify-between py-8 px-6 z-10">
      <div>
        <div className="mb-12">
          <h2 className="text-2xl font-serif tracking-widest uppercase">Loom &<br/>Logic</h2>
          <div className="h-[1px] w-12 bg-current mt-4 opacity-30"></div>
        </div>

        <nav className="space-y-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full space-x-4 text-sm tracking-widest uppercase transition-all duration-300 ${
                activeTab === item.id 
                  ? 'opacity-100 font-medium' 
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-[var(--color-vogue-accent)]' : ''} />
              <span>{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-vogue-accent)] ml-auto"
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-8 border-t border-[var(--border-color)]">
        <button
          onClick={toggleDarkMode}
          className="flex items-center space-x-4 text-sm tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDarkMode ? 'Light Mode' : 'Drafting Mode'}</span>
        </button>
      </div>
    </div>
  );
}
