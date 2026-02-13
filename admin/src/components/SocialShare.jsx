import { useState, useEffect } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { getShareUrls } from '../lib/api';

export default function SocialShare({ submission, txHash, tokenId }) {
  const [urls, setUrls] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (submission.id && txHash) {
      getShareUrls(submission.id).then(setUrls).catch(() => {});
    }
  }, [submission.id, txHash]);

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!urls) return null;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        <Share2 size={14} /> Share
      </h3>

      <div className="flex gap-2">
        {/* X / Twitter */}
        <a
          href={urls.x.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition text-center"
        >
          Post to X
        </a>

        {/* Bluesky */}
        <a
          href={urls.bluesky.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition text-center"
        >
          Post to Bluesky
        </a>
      </div>

      {/* Instagram - copy caption */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Instagram Caption</span>
          <button
            onClick={() => copyToClipboard(urls.instagram.caption)}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-gray-600 whitespace-pre-wrap">{urls.instagram.caption}</p>
      </div>

      {/* OpenSea link */}
      {urls.opensea && (
        <a
          href={urls.opensea}
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
