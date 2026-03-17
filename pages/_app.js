//ensures the theme (light/dark) is applied globally across the app.
import "@/styles/globals.css";
import Header from '@/components/header';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

export default function App({ Component, pageProps }) {

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
          <Header />
          <main className="flex-1">
            <Component {...pageProps} />
          </main>
          <footer className="relative z-10 text-center py-4 text-sm text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
            © {new Date().getFullYear()} Crypi. All rights reserved.
          </footer>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}