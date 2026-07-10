import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Uploader from '@/components/Uploader';
import SenderForm from '@/components/SenderForm';

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  const { data: senders } = await supabase.from('senders').select('*').eq('user_id', user.id);
  const hasSender = senders && senders.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-[#111111] p-6 rounded-2xl border border-gray-800">
          <div>
            <h1 className="text-3xl font-extrabold text-purple-400">Employee Workspace</h1>
            <p className="text-gray-400 mt-1">Logged in as {profile?.email}</p>
          </div>
          <a href="/auth/signout" className="px-6 py-2 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-900/50 transition">
            Sign Out
          </a>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {hasSender ? (
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">Queue New Campaign</h2>
              <p className="text-gray-400 mb-8">Upload your Excel contact list and Word template below.</p>
              <Uploader employeeId={user.id} />
            </div>
          ) : (
            <SenderForm userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}
