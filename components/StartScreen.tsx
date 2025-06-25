
import React, { useState } from 'react';

interface StartScreenProps {
  onStart: (theme: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [theme, setTheme] = useState<string>('');
  const [error, setError] = useState<string>('');

  const popularThemes = [
    "Mystical Forest Quest",
    "Cyberpunk City Heist",
    "Interstellar Exploration",
    "Haunted Mansion Mystery",
    "Lost Pirate Treasure",
    "Post-Apocalyptic Survival"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (theme.trim() === '') {
      setError('Please enter a theme for your adventure.');
      return;
    }
    setError('');
    onStart(theme);
  };

  const handleThemeButtonClick = (selectedTheme: string) => {
    setTheme(selectedTheme);
    setError('');
    // Optionally auto-submit or wait for user to click main start button
    // onStart(selectedTheme); 
  };

  return (
    <div className="w-full max-w-lg p-8 bg-gray-800 rounded-xl shadow-2xl text-center">
      <h2 className="text-3xl font-semibold mb-6 text-indigo-300">Begin Your Adventure!</h2>
      <p className="mb-6 text-gray-300">
        What kind of story shall we weave today? Enter a theme or choose one below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="theme" className="sr-only">Adventure Theme</label>
          <input
            type="text"
            id="theme"
            value={theme}
            onChange={(e) => { setTheme(e.target.value); setError(''); }}
            placeholder="e.g., 'Sci-Fi Space Opera', 'Fantasy Dragon Slayer'"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
          />
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={!theme.trim()}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Weaving Your Tale
        </button>
      </form>
      <div className="mt-8">
        <p className="text-gray-400 mb-3">Or pick a popular theme:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularThemes.map((popularTheme) => (
            <button
              key={popularTheme}
              onClick={() => handleThemeButtonClick(popularTheme)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                theme === popularTheme 
                ? 'bg-indigo-500 text-white ring-2 ring-indigo-300' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
            >
              {popularTheme}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
    