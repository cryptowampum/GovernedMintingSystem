import { createConfig, http } from 'wagmi';
import { polygon, base } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { unicornConnector } from '@unicorn.eth/autoconnect';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet],
    },
  ],
  {
    appName: 'Governed Minting System',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  }
);

export const config = createConfig({
  chains: [polygon, base],
  connectors: [
    ...connectors,
    unicornConnector({
      clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || '',
      factoryAddress: import.meta.env.VITE_FACTORY_ADDRESS || '0xD771615c873ba5a2149D5312448cE01D677Ee48A',
      defaultChain: polygon.id,
    }),
  ],
  transports: {
    [polygon.id]: http(),
    [base.id]: http(),
  },
});
