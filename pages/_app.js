//ensures the theme (light/dark) is applied globally across the app.
import "@/styles/globals.css";
import Header from '../components/header';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

export default function App({ Component, pageProps }) {

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <Header />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}