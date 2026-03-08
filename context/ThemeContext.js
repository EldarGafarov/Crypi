import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Sync React state with whatever _document.js already applied to <html>.
    // This runs once on mount—  it doesn't apply the class (that already happened),
    // it just makes isDarkMode match reality so the toggle icon shows correctly.
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark') {
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;

      // 'dark' class on <html> is what Tailwind's darkMode: 'class' watches.
      // Adding/removing it here instantly switches every dark: style in the app.
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }

      return newMode;
    });
  };

  // isDarkMode is only exposed for the toggle button icon swap (Moon vs Sun).
  // All actual dark styling is handled by Tailwind dark: classes, not this value.
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
