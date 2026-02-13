import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { UnicornAutoConnect } from '@unicorn.eth/autoconnect';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import AdminGate from './components/AdminGate';
import Dashboard from './components/Dashboard';

const queryClient = new QueryClient();

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
          <AdminGate>
            <Dashboard />
          </AdminGate>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
