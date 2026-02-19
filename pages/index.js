import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isDarkMode } = useTheme();
  const { user, loading } = useAuth();
  
  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 py-8
      ${isDarkMode 
        ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black'
        : 'bg-white'}`}>
      
      {/* Main content */}
      <div className="relative z-10 text-center px-6 w-full max-w-7xl">
        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide mb-4 
          text-cyan-400">
          Welcome to Crypi
        </h1>
        
        <p className={`text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto
          ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Explore live cryptocurrency prices, market trends, and more. 
          Empowering your crypto journey.
        </p>

        {/* Buttons container */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
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
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-blue-600 rounded-full opacity-30 blur-3xl"></div>
      </div>
    </div>
  );
}