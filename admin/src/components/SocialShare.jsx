import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';

const normalize = (h) => h ? `@${h.replace(/^@/, '')}` : '';

const OPENSEA_CHAINS = { 137: 'matic', 8453: 'base', 42161: 'arbitrum' };

const DEFAULT_CONTRACT = '0x398bf23a6f4b2a58e98744312084e2e4f6e71b2c';

export default function SocialShare({ submission, txHash, tokenId, contractAddress = DEFAULT_CONTRACT }) {
  const [copied, setCopied] = useState(false);

  if (!txHash) return null;

  const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '137');
  const openseaChain = OPENSEA_CHAINS[chainId] || 'matic';

  const openseaUrl = tokenId && contractAddress
    ? `https://opensea.io/item/${openseaChain}/${contractAddress}/${tokenId}`
    : null;

  // User handles (from submission)
  const xHandle = normalize(submission.xHandle);
  const blueskyHandle = normalize(submission.blueskyHandle);
  const instagramHandle = normalize(submission.instagramHandle);

  // Brand handles (from env)
  const brandXHandle = normalize(import.meta.env.VITE_TWITTER_HANDLE);
  const brandBskyHandle = normalize(import.meta.env.VITE_BLUESKY_HANDLE);
  const serviceLink = import.meta.env.VITE_SERVICE_LINK || '';

  const xText = [
    submission.comment,
    xHandle,
    openseaUrl,
    [serviceLink, brandXHandle ? `via ${brandXHandle}` : ''].filter(Boolean).join(' '),
  ].filter(Boolean).join('\n');

  const bskyText = [
    submission.comment,
    blueskyHandle,
    openseaUrl,
    [serviceLink, brandBskyHandle ? `via ${brandBskyHandle}` : ''].filter(Boolean).join(' '),
  ].filter(Boolean).join('\n');

  const instaText = [
    submission.comment,
    instagramHandle,
    '#NFT',
    openseaUrl,
    serviceLink,
  ].filter(Boolean).join('\n');

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`;
  const bskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(bskyText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(instaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        <Share2 size={14} /> Share
      </h3>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => window.open(xUrl, '_blank', 'noopener,noreferrer')}
          className="inline-flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium bg-black hover:bg-gray-800 transition"
        >
          <span className="mr-1.5">🐦</span> X / Twitter
        </button>

        <button
          onClick={() => window.open(bskyUrl, '_blank', 'noopener,noreferrer')}
          className="inline-flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition"
        >
          <span className="mr-1.5">🦋</span> Bluesky
        </button>

        <button
          onClick={handleCopy}
          className="inline-flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium bg-pink-500 hover:bg-pink-600 transition"
        >
          {copied ? (
            <><Check size={14} className="mr-1.5" /> Copied!</>
          ) : (
            <><Copy size={14} className="mr-1.5" /> Instagram</>
          )}
        </button>
      </div>

      {openseaUrl && (
        <a
          href={openseaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
        >
          View on OpenSea <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
