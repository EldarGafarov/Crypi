import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`relative flex items-center w-24 h-12 rounded-full p-1 transition-colors duration-300 ease-in-out
        ${isDarkMode 
          ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black' 
          : 'bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300'
        }`}
    >
      {/* Track Background with Animated Stars/Clouds */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-300
          ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
          {/* Stars for dark mode */}
          <div className="absolute h-1 w-1 bg-white rounded-full top-2 left-3 animate-twinkle"></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-4 left-6 animate-twinkle delay-100"></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-3 right-4 animate-twinkle delay-200"></div>
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300
          ${isDarkMode ? 'opacity-0' : 'opacity-100'}`}>
          {/* Clouds for light mode */}
          <div className="absolute bg-white/30 rounded-full h-3 w-6 top-2 left-4 animate-float"></div>
          <div className="absolute bg-white/30 rounded-full h-3 w-8 bottom-2 right-3 animate-float delay-100"></div>
        </div>
      </div>

      {/* Sliding Circle with Icons */}
      <div
        className={`relative z-10 w-10 h-10 rounded-full transform transition-transform duration-300 ease-in-out flex items-center justify-center
          ${isDarkMode 
            ? 'translate-x-12 bg-gray-700' 
            : 'translate-x-0 bg-white'
          }`}
      >
        {isDarkMode ? (
          <Moon className="w-6 h-6 text-white" />
        ) : (
          <Sun className="w-6 h-6 text-yellow-500" />
        )}
      </div>
    </button>
  );
}