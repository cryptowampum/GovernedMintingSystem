import { createConfig, http } from 'wagmi';
import { polygon, base } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { unicornConnector } from '@unicorn.eth/autoconnect';

const params = new URLSearchParams(window.location.search);
const isUnicornFlow = params.has('walletId') || params.has('autoconnect');

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet],
    },
  ],
  {
    appName: 'Community Minting Platform',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  }
);

const allConnectors = [
  ...connectors,
  ...(isUnicornFlow
    ? [
        unicornConnector({
          clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || '',
          factoryAddress: import.meta.env.VITE_FACTORY_ADDRESS || '0xD771615c873ba5a2149D5312448cE01D677Ee48A',
          defaultChain: polygon.id,
        }),
      ]
    : []),
];

export const config = createConfig({
  chains: [polygon, base],
  connectors: allConnectors,
  transports: {
    [polygon.id]: http(),
    [base.id]: http(),
  },
});
