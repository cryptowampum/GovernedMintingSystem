import { useState } from 'react';
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { UnicornAutoConnect } from '@unicorn.eth/autoconnect';
import { LogOut } from 'lucide-react';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import WalletGate from './components/WalletGate';
import SubmissionForm from './components/SubmissionForm';
import ConfirmationScreen from './components/ConfirmationScreen';

const queryClient = new QueryClient();

function GovernedMintApp() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const [submittedEntry, setSubmittedEntry] = useState(null);

  const isUnicorn = connector?.id === 'unicorn';

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-page flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Governed Minting</h1>
          <p className="text-center text-gray-500 text-sm mb-6">Submit your photo for NFT consideration</p>
          <WalletGate />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-page p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-white/30 backdrop-blur-sm rounded-2xl px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            {isUnicorn && <span title="Unicorn Wallet">🦄</span>}
          </div>
          <button onClick={() => disconnect()} className="text-gray-400 hover:text-gray-600 transition">
            <LogOut size={18} />
          </button>
        </div>

        {/* Main card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1">Submit Your Photo</h1>
          <p className="text-sm text-gray-500 mb-5">Take a photo and add details for NFT minting consideration</p>

          {submittedEntry ? (
            <ConfirmationScreen submission={submittedEntry} onReset={() => setSubmittedEntry(null)} />
          ) : (
            <SubmissionForm walletAddress={address} onSuccess={setSubmittedEntry} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <UnicornAutoConnect
            debug={import.meta.env.DEV}
            onConnect={(wallet) => console.log('Unicorn connected:', wallet)}
            onError={(error) => {
              window.dispatchEvent(new CustomEvent('unicorn-connect-error', { detail: error }));
            }}
          />
          <GovernedMintApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
