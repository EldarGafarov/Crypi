import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false); // true after successful registration

  useEffect(() => {
    if (user) router.push('/wallet');
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setError(data.error);
    if (data.warning) return setError(data.warning);

    // Account created — show "check your inbox" screen instead of logging in
    setSent(true);
  };

  // Success screen
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4
        bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black">
        <div className="w-full max-w-md p-8 rounded-xl shadow-xl text-center
          bg-gray-50 dark:bg-gray-800">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-2">Check your inbox</h2>
          <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">
            We sent a verification link to
          </p>
          <p className="text-cyan-400 font-semibold mb-4">{form.email}</p>
          <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
            Click the link in the email to activate your account. The link expires in 24 hours.
          </p>
          <p className="text-xs mb-6 text-gray-400 dark:text-gray-500">
            Can't find it? Check your <strong>spam or junk folder</strong>.
          </p>
          <Link href="/login">
            <span className="inline-block px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition cursor-pointer">
              Go to Login
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center px-4
      bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black">
      <div className="w-full max-w-md p-8 rounded-xl shadow-xl
        bg-gray-50 dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              minLength={3}
              maxLength={30}
              className="w-full px-4 py-2 rounded-lg border outline-none transition
                bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
                text-gray-900 dark:text-white placeholder-gray-400
                focus:border-cyan-500 dark:focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full px-4 py-2 rounded-lg border outline-none transition
                bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
                text-gray-900 dark:text-white placeholder-gray-400
                focus:border-cyan-500 dark:focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border outline-none transition
                bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
                text-gray-900 dark:text-white placeholder-gray-400
                focus:border-cyan-500 dark:focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login">
            <span className="text-cyan-400 hover:underline cursor-pointer font-medium">Login</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
