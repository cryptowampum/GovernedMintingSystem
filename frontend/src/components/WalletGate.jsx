import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

export default function WalletGate() {
  const [autoconnectTimeout, setAutoconnectTimeout] = useState(false);

  const isAutoconnecting = () => {
    const params = new URLSearchParams(window.location.search);
    return params.has('walletId') || params.has('autoconnect');
  };

  useEffect(() => {
    if (isAutoconnecting()) {
      const timer = setTimeout(() => setAutoconnectTimeout(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (isAutoconnecting() && !autoconnectTimeout) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600">Connecting wallet...</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 space-y-6">
      <Wallet size={48} className="mx-auto text-indigo-400" />
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-500 text-sm">Connect to submit your photo for review</p>
      </div>
      {autoconnectTimeout && (
        <p className="text-sm text-amber-600">Auto-connect timed out. Please connect manually.</p>
      )}
      <div className="flex justify-center">
        <ConnectButton />
      </div>
    </div>
  );
}
