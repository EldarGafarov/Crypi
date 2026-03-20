import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setError(data.error);
    login(data.user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4
      bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black">
      <div className="w-full max-w-md p-8 rounded-xl shadow-xl
        bg-gray-50 dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">Welcome Back</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Email or Username
            </label>
            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Enter email or username"
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
              placeholder="Enter password"
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/register">
            <span className="text-cyan-400 hover:underline cursor-pointer font-medium">Register</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
