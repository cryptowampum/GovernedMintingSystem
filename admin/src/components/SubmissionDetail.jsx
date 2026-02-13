import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Pencil, Save } from 'lucide-react';
import { updateSubmission, approveSubmission, denySubmission, listCollections } from '../lib/api';
import MintAction from './MintAction';

export default function SubmissionDetail({ submission: initial, onBack }) {
  const [sub, setSub] = useState(initial);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState({});
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    listCollections().then(setCollections).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const { submission } = await updateSubmission(sub.id, edits);
      setSub(submission);
      setEditing(false);
      setEdits({});
    } catch (err) { setError(err.message); }
  };

  const handleApprove = async () => {
    if (!selectedCollection) { setError('Select a collection first'); return; }
    setActing(true);
    setError('');
    try {
      const { submission } = await approveSubmission(sub.id, selectedCollection);
      setSub(submission);
    } catch (err) { setError(err.message); }
    finally { setActing(false); }
  };

  const handleDeny = async () => {
    setActing(true);
    setError('');
    try {
      const { submission } = await denySubmission(sub.id, edits.adminNotes || '');
      setSub(submission);
    } catch (err) { setError(err.message); }
    finally { setActing(false); }
  };

  const field = (label, key) => {
    const val = editing ? (edits[key] ?? sub[key] ?? '') : (sub[key] || '');
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        {editing ? (
          <input
            value={val}
            onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        ) : (
          <p className="text-sm text-gray-800">{val || <span className="text-gray-300">-</span>}</p>
        )}
      </div>
    );
  };

  const isPending = sub.status === 'pending';
  const isApproved = sub.status === 'approved';

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Back to queue
      </button>

      <div className="bg-white/95 rounded-2xl shadow-lg overflow-hidden">
        <img src={sub.photoGatewayUrl} alt="" className="w-full max-h-80 object-cover" />

        <div className="p-6 space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              sub.status === 'approved' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {sub.status}
            </span>
            {isPending && (
              <button onClick={() => editing ? handleSave() : setEditing(true)} className="text-gray-400 hover:text-gray-600">
                {editing ? <Save size={18} /> : <Pencil size={18} />}
              </button>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Comment</label>
            {editing ? (
              <textarea
                value={edits.comment ?? sub.comment}
                onChange={(e) => setEdits({ ...edits, comment: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-800">{sub.comment}</p>
            )}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            {field('X Handle', 'xHandle')}
            {field('Instagram', 'instagramHandle')}
            {field('Bluesky', 'blueskyHandle')}
            {field('Email', 'email')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Wallet</label>
              <p className="text-xs font-mono text-gray-600 break-all">{sub.walletAddress}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Submitted</label>
              <p className="text-sm text-gray-600">{new Date(sub.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Admin notes */}
          {(editing || sub.adminNotes) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Admin Notes</label>
              {editing ? (
                <textarea
                  value={edits.adminNotes ?? sub.adminNotes ?? ''}
                  onChange={(e) => setEdits({ ...edits, adminNotes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Internal notes..."
                />
              ) : (
                <p className="text-sm text-gray-600">{sub.adminNotes}</p>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Actions for pending */}
          {isPending && !editing && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mint to Collection</label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select collection...</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.contractAddress.slice(0, 8)}...)</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={acting || !selectedCollection}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={18} /> Approve
                </button>
                <button
                  onClick={handleDeny}
                  disabled={acting}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X size={18} /> Deny
                </button>
              </div>
            </div>
          )}

          {/* Mint action for approved */}
          {isApproved && !sub.mintTxHash && (
            <MintAction submission={sub} onMinted={(updated) => setSub(updated)} />
          )}

          {/* Show mint info */}
          {sub.mintTxHash && (
            <MintAction submission={sub} onMinted={() => {}} alreadyMinted />
          )}
        </div>
      </div>
    </div>
  );
}
