import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../context/ThemeContext';

export default function VerifyEmail() {
  const { query } = useRouter();
  const { isDarkMode } = useTheme();
  const success = query.success === '1';

  return (
    <div className={`min-h-screen flex items-center justify-center px-4
      ${isDarkMode ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black' : 'bg-white'}`}>

      <div className={`w-full max-w-md rounded-xl shadow-xl p-8 text-center
        ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>

        {success ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-400 mb-2">Email Verified!</h1>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your account is now active. You can log in.
            </p>
            <Link href="/login">
              <span className="inline-block px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition cursor-pointer">
                Go to Login
              </span>
            </Link>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h1>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              This link is invalid or has expired. Please register again.
            </p>
            <Link href="/register">
              <span className="inline-block px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition cursor-pointer">
                Register Again
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
