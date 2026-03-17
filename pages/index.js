import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { IoTrendingUpSharp, IoFlashSharp, IoMailSharp, IoStatsChartSharp, IoNotificationsSharp, IoWalletOutline } from 'react-icons/io5';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8
      bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black">

      {/* Main content */}
      <div className="relative z-10 text-center px-6 w-full max-w-7xl">
        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide mb-4
          text-cyan-400">
          Crypto, Simplified.
        </h1>

        <p className="text-lg md:text-xl font-light mb-6 max-w-2xl mx-auto
          text-gray-800 dark:text-white">
          Smart alerts, live prices, and your personal wallet in one dashboard.
        </p>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-medium text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><IoTrendingUpSharp className="text-cyan-400" /> 250+ Coins Tracked</span>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
          <span className="flex items-center gap-1"><IoFlashSharp className="text-cyan-400" /> Real-Time Prices</span>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
          <span className="flex items-center gap-1"><IoMailSharp className="text-cyan-400" /> Instant Email Alerts</span>
        </div>

        {/* Buttons container */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-2">
          <Link href="/dashboard" legacyBehavior>
            <a className="bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-6 rounded-lg shadow-lg text-lg transition">
              Go to Dashboard
            </a>
          </Link>
          <Link href="/about" legacyBehavior>
            <a className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg shadow-lg text-lg transition">
              About Us
            </a>
          </Link>
          {!loading && (
            user ? (
              <Link href="/wallet" legacyBehavior>
                <a className="bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-6 rounded-lg shadow-lg text-lg transition">
                  My Wallet
                </a>
              </Link>
            ) : (
              <Link href="/login" legacyBehavior>
                <a className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg shadow-lg text-lg transition">
                  Login
                </a>
              </Link>
            )
          )}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          <div className="rounded-xl p-6 bg-gray-100 dark:bg-gray-800 shadow-md text-left">
            <IoStatsChartSharp className="text-4xl text-cyan-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Live Prices</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stream real-time prices from Binance with second-by-second updates across 250+ coins.</p>
          </div>
          <div className="rounded-xl p-6 bg-gray-100 dark:bg-gray-800 shadow-md text-left">
            <IoNotificationsSharp className="text-4xl text-cyan-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Price Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set a target price and get an email the moment a coin crosses it - above or below.</p>
          </div>
          <div className="rounded-xl p-6 bg-gray-100 dark:bg-gray-800 shadow-md text-left">
            <IoWalletOutline className="text-4xl text-cyan-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Portfolio Wallet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your holdings and see their live value update in real time, all in your personal wallet.</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-blue-600 rounded-full opacity-30 blur-3xl"></div>
      </div>
    </div>
  );
}
