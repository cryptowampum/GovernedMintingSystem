import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { listSubmissions } from '../lib/api';
import SubmissionDetail from './SubmissionDetail';

export default function SubmissionQueue() {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await listSubmissions('pending', page);
      setSubmissions(data.submissions);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, [page]);

  if (selected) {
    return (
      <SubmissionDetail
        submission={selected}
        onBack={() => { setSelected(null); fetchSubmissions(); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{total} Pending Submissions</h2>
        <button onClick={fetchSubmissions} disabled={loading} className="text-gray-400 hover:text-gray-600 transition">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {submissions.length === 0 && !loading && (
        <div className="bg-white/80 rounded-2xl p-12 text-center text-gray-400">No pending submissions</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s)}
            className="bg-white/90 rounded-2xl shadow-sm hover:shadow-md transition p-4 text-left"
          >
            <img src={s.photoGatewayUrl} alt="" className="w-full h-40 object-cover rounded-xl mb-3" />
            <p className="text-sm text-gray-800 line-clamp-2 mb-2">{s.comment}</p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-mono">{s.walletAddress?.slice(0, 6)}...{s.walletAddress?.slice(-4)}</span>
              <span>{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white rounded-lg text-sm disabled:opacity-50">Prev</button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={submissions.length < 20} className="px-4 py-2 bg-white rounded-lg text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
