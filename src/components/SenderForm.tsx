"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SenderForm({ userId }: { userId: string }) {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.from('senders').insert({
        user_id: userId,
        email,
        app_password: appPassword
      });
      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-400">Add Sender Account</h2>
      <p className="text-gray-400 mb-6">Configure a Google Account with a 16-digit App Password for employees to use.</p>
      
      {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
      
      <div className="space-y-4 max-w-md">
        <input 
          type="email" 
          placeholder="Gmail Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
        />
        <input 
          type="password" 
          placeholder="16-digit Google App Password"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={loading || !email || !appPassword}
          className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Credentials"}
        </button>
      </div>
    </div>
  );
}
