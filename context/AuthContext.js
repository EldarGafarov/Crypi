import { createContext, useContext, useState, useEffect } from 'react';

// Creates the context object — this is the "shared space" that any component can read from
const AuthContext = createContext();

// AuthProvider wraps the entire app (in _app.js) so every page and component
// can access the current user without passing it down through props manually.
export function AuthProvider({ children }) {
  // null = nobody logged in, object = the logged-in user's data
  const [user, setUser] = useState(null);
  // loading stays true until we finish checking if the user is already logged in.
  // This prevents the header from flickering between "logged out" and "logged in" on page load.
  const [loading, setLoading] = useState(true);

  // On app startup, call /api/auth/me to check if a valid cookie exists.
  // This is how we remember the user is logged in after a page refresh.
  // The [] means this runs only once when the app first loads.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => {
        // If the request fails entirely (e.g. network error), treat as logged out
        setUser(null);
        setLoading(false);
      });
  }, []);

  // Called immediately after a successful register or login API response.
  // Just updates the in-memory user state — the cookie is already set by the server.
  const login = (userData) => setUser(userData);

  // Calls the logout API (which deletes the cookie on the server),
  // then clears the user from memory so the UI updates instantly.
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  // Makes user, loading, login, and logout available to any component that calls useAuth()
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shortcut hook — any component can write: const { user, logout } = useAuth()
export const useAuth = () => useContext(AuthContext);
