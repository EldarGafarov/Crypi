import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        {/*
          Runs BEFORE React loads — before anything is painted on screen.
          Reads the saved theme from localStorage and immediately adds the 'dark'
          class to <html> if needed.

          Without this, dark-mode users see a white flash on every page load because
          React starts in light mode and only switches after useEffect fires.
          The try/catch handles cases where localStorage is blocked (e.g. private browsing).
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark') document.documentElement.classList.add('dark');
            } catch(e) {}
          })();
        `}} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
