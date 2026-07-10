"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (action: 'login' | 'signup') => {
    setLoading(true);
    setError('');
    
    try {
      if (action === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Account created! Check your email or try logging in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh(); 
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#111111] border border-gray-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
            Autoemailer
          </h1>
          <p className="text-gray-400">Sign in to your workspace</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="email" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={() => handleAuth('login')}
            disabled={loading || !email || !password}
            className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
          
          <button
            onClick={() => handleAuth('signup')}
            disabled={loading || !email || !password}
            className="w-full py-4 rounded-xl font-semibold bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center mt-2 text-gray-300"
          >
            Create Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
