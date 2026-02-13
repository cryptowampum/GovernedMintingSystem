import { useState } from 'react';
import { Coins, ExternalLink } from 'lucide-react';
import { mintSubmission } from '../lib/api';
import SocialShare from './SocialShare';

export default function MintAction({ submission, onMinted, alreadyMinted }) {
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [mintResult, setMintResult] = useState(
    alreadyMinted ? { txHash: submission.mintTxHash, tokenId: submission.tokenId } : null
  );

  const handleMint = async () => {
    setMinting(true);
    setError('');
    try {
      const result = await mintSubmission(submission.id);
      setMintResult({ txHash: result.txHash, tokenId: result.tokenId });
      onMinted({ ...submission, mintTxHash: result.txHash, tokenId: result.tokenId });
    } catch (err) {
      setError(err.message);
    } finally {
      setMinting(false);
    }
  };

  if (mintResult) {
    return (
      <div className="space-y-4 pt-2">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 font-semibold text-sm mb-2">
            {alreadyMinted ? 'Minted' : 'Minted Successfully!'}
          </p>
          {mintResult.tokenId && (
            <p className="text-xs text-green-600">Token ID: {mintResult.tokenId}</p>
          )}
          <a
            href={`https://polygonscan.com/tx/${mintResult.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"
          >
            View Transaction <ExternalLink size={12} />
          </a>
        </div>
        <SocialShare submission={submission} txHash={mintResult.txHash} tokenId={mintResult.tokenId} />
      </div>
    );
  }

  return (
    <div className="pt-2">
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={handleMint}
        disabled={minting}
        className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {minting ? (
          <span className="animate-pulse">Minting...</span>
        ) : (
          <><Coins size={18} /> Mint NFT</>
        )}
      </button>
    </div>
  );
}
