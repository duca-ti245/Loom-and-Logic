import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { InfiniteCanvas } from './components/dashboard/InfiniteCanvas';
import { IdeaStudio } from './components/idea-studio/IdeaStudio';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'studio' | 'library'>('canvas');

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        <header className="flex justify-between items-end mb-12 border-b border-[var(--border-color)] pb-4">
          <div>
            <h1 className="text-4xl font-serif tracking-wide">
              {activeTab === 'canvas' ? 'The Infinite Canvas' : activeTab === 'studio' ? 'AI Idea Studio' : 'Detail Library'}
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-light tracking-wider uppercase">
              {activeTab === 'canvas' ? 'Your saved ideas and collections' : activeTab === 'studio' ? 'Generate new concepts' : 'Mix and match technical details'}
            </p>
          </div>
        </header>

        {activeTab === 'canvas' && <InfiniteCanvas />}
        {activeTab === 'studio' && <IdeaStudio />}
        {activeTab === 'library' && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Detail Library coming soon...
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
