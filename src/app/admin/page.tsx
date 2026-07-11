import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Mail, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import SenderForm from '@/components/SenderForm';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();

  const { data: queueItems } = await supabase.from('queue').select('status, employee_id');
  const { data: employees } = await supabase.from('users').select('*').eq('role', 'employee');
  const { data: senders } = await supabase.from('senders').select('email');

  const totalSent = queueItems?.filter(q => q.status === 'sent').length || 0;
  const totalFailed = queueItems?.filter(q => q.status === 'failed').length || 0;
  const totalPending = queueItems?.filter(q => q.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-[#111111] p-6 rounded-2xl border border-gray-800">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-400">Admin Command Center</h1>
            <p className="text-gray-400 mt-1">Welcome back, {profile?.email}</p>
          </div>
          <a href="/auth/signout" className="px-6 py-2 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-900/50 transition">
            Sign Out
          </a>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center space-x-3 mb-2 text-gray-400">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Employees</span>
            </div>
            <p className="text-4xl font-bold">{employees?.length || 0}</p>
          </div>
          <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center space-x-3 mb-2 text-gray-400">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Successfully Sent</span>
            </div>
            <p className="text-4xl font-bold">{totalSent}</p>
          </div>
          <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center space-x-3 mb-2 text-gray-400">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Pending Queue</span>
            </div>
            <p className="text-4xl font-bold">{totalPending}</p>
          </div>
          <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center space-x-3 mb-2 text-gray-400">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Failed Deliveries</span>
            </div>
            <p className="text-4xl font-bold">{totalFailed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Configured Sender Accounts</h2>
            {senders && senders.length > 0 ? (
              <ul className="space-y-4">
                {senders.map((s, i) => (
                  <li key={i} className="text-gray-300 bg-black/40 p-4 rounded-xl border border-gray-800 flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-blue-400" />
                    {s.email}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No sender accounts configured.</p>
            )}
          </div>
          <SenderForm userId={user.id} />
        </div>

        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Employee Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="pb-4 font-semibold">Employee Email</th>
                  <th className="pb-4 font-semibold">Queued Emails</th>
                  <th className="pb-4 font-semibold">Sent Successfully</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {employees?.map((emp) => {
                  const empQueue = queueItems?.filter(q => q.employee_id === emp.id) || [];
                  return (
                    <tr key={emp.id}>
                      <td className="py-4">{emp.email}</td>
                      <td className="py-4 text-blue-400">{empQueue.length}</td>
                      <td className="py-4 text-green-400">{empQueue.filter(q => q.status === 'sent').length}</td>
                    </tr>
                  )
                })}
                {(!employees || employees.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
