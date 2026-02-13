import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ShieldCheck, LogIn } from 'lucide-react';
import useAdminAuth from '../hooks/useAdminAuth';

export default function AdminGate({ children }) {
  const { isConnected } = useAccount();
  const { isAdmin, authenticate, loading, error } = useAdminAuth();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-page flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md text-center space-y-6">
          <ShieldCheck size={48} className="mx-auto text-indigo-400" />
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Connect an authorized admin wallet</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-page flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md text-center space-y-6">
          <ShieldCheck size={48} className="mx-auto text-indigo-400" />
          <h1 className="text-2xl font-bold text-gray-800">Admin Authentication</h1>
          <p className="text-gray-500 text-sm">Sign a message to verify your admin access</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={authenticate}
            disabled={loading}
            className="bg-gradient-brand text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? 'Signing...' : <><LogIn size={18} /> Sign to Authenticate</>}
          </button>
        </div>
      </div>
    );
  }

  return children;
}
