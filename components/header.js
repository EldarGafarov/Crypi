/**
 * Header Component
 * Displays the application header with a home button, dynamic page title, and a dark mode toggle.
 *
 * returns The header with navigation and theme control.
 */

import Link from 'next/link';
import { IoHomeSharp, IoMoonSharp, IoSunnySharp, IoWalletOutline } from "react-icons/io5";
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Header() {
  // isDarkMode is only needed here to swap the Moon/Sun icon.
  // All dark styling in this component is handled by Tailwind dark: classes.
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const getPageTitle = () => {
    if (router.pathname === '/dashboard') {
      return 'Crypi Coin Dashboard';
    } else if (router.pathname === '/coin/[symbol]') {
      return `${router.query.symbol?.toUpperCase()} Data`;
    } else if (router.pathname === '/wallet') {
      return 'My Wallet';
    } else if (router.pathname === '/login') {
      return 'Login';
    } else if (router.pathname === '/register') {
      return 'Register';
    }
    return '';
  };

  return (
    <header className="header p-4 flex justify-between items-center shadow-md
      bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-gray-800 dark:via-gray-900 dark:to-black">
      {/* Left - Home icon */}
      <div>
        {router.pathname !== '/' && (
          <Link href="/">
            <IoHomeSharp size={32} className="text-white" />
          </Link>
        )}
      </div>

      {/* Center - Title */}
      <h1 className="flex-1 text-2xl font-bold text-center text-white">
        {getPageTitle()}
      </h1>

      {/* Right - Auth links + Theme toggle */}
      <div className="flex items-center gap-3">
        {!loading && user && (
          <>
            <Link href="/wallet">
              <IoWalletOutline size={28} className="text-white" />
            </Link>
            <button
              onClick={logout}
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
            >
              Logout
            </button>
          </>
        )}

        {!loading && !user && (
          <Link href="/login">
            <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition cursor-pointer">
              Login
            </span>
          </Link>
        )}

        {/* Theme toggle button */}
        <button
          onClick={toggleDarkMode}
          className="relative flex items-center w-24 h-12 rounded-full p-1 transition-colors duration-300 ease-in-out
            bg-gradient-to-r from-blue-200 via-blue-800 dark:from-gray-800 dark:via-gray-900 dark:to-black"
        >
          {/* Circle slides right in dark mode via dark:translate-x-12 */}
          <div
            className="relative z-10 w-10 h-10 rounded-full transform transition-transform duration-300 ease-in-out flex items-center justify-center
              translate-x-0 bg-white dark:translate-x-12 dark:bg-gray-700"
          >
            {/* Icon swap — the only place isDarkMode is used. Can't swap rendered elements with CSS alone. */}
            {isDarkMode ? (
              <IoMoonSharp className="w-6 h-6 text-white" />
            ) : (
              <IoSunnySharp className="w-6 h-6 text-yellow-500" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
