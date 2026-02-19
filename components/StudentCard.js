/**
 * StudentCard component displays a student's profile information including their name, workplace, 
 * profile image, and LinkedIn profile link. The design adapts based on the current theme (light or dark mode).
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function StudentCard({ name, linkedin, image, workplace }) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`p-6 rounded-lg shadow-lg transform hover:-translate-y-2 transition-transform duration-300 w-64 flex flex-col justify-between
        ${isDarkMode
          ? 'bg-gradient-to-br from-gray-700 to-gray-900'
          : 'bg-gradient-to-br from-cyan-500 to-blue-500'}`}
    >
      <div className="flex-grow">
        <img
          src={image}
          alt={`${name}'s profile`}
          className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white"
        />
        <h2
          className={`text-xl font-semibold text-center mb-2
            ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {name}
        </h2>
        <p
          className={`text-center text-sm mb-4
            ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {workplace}
        </p>
      </div>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className={`block text-center underline text-sm transition
          ${isDarkMode
            ? 'text-white hover:text-gray-200'
            : 'text-gray-900 hover:text-gray-700'}`}
      >
        LinkedIn Profile
      </a>
    </div>
  );
}
