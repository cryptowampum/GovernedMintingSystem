import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { LogOut, Clock, History } from 'lucide-react';
import SubmissionQueue from './SubmissionQueue';
import SubmissionHistory from './SubmissionHistory';
import useAdminAuth from '../hooks/useAdminAuth';

export default function Dashboard() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { logout } = useAdminAuth();
  const [tab, setTab] = useState('pending');

  const handleLogout = () => {
    logout();
    disconnect();
  };

  return (
    <div className="min-h-screen bg-gradient-page">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-gray-800 text-sm sm:text-lg">Unicorns, Inc Community Minting Admin</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-500 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="flex gap-1 bg-white/50 rounded-xl p-1 w-fit mb-3 sm:mb-4">
          <button
            onClick={() => setTab('pending')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition ${
              tab === 'pending' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={16} /> Pending
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition ${
              tab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={16} /> History
          </button>
        </div>

        {tab === 'pending' ? <SubmissionQueue /> : <SubmissionHistory />}
      </div>
    </div>
  );
}
