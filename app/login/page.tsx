'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid password');
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 p-8 sm:p-10 border border-zinc-800 shadow-2xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 bg-white text-zinc-950 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider">StarFashion Admin</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">Isolated Management Dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 text-xs font-mono uppercase text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 text-sm focus:outline-none focus:border-white font-mono text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-zinc-950 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                Access Admin Panel <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
