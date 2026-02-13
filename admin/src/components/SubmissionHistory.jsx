import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { listSubmissions } from '../lib/api';
import SubmissionDetail from './SubmissionDetail';

export default function SubmissionHistory() {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await listSubmissions(filter || undefined, page);
      setSubmissions(data.submissions.filter(s => s.status !== 'pending'));
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, [page, filter]);

  if (selected) {
    return <SubmissionDetail submission={selected} onBack={() => { setSelected(null); fetchSubmissions(); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">History</h2>
          <div className="flex gap-1 bg-white/50 rounded-lg p-0.5">
            {['', 'approved', 'denied'].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                {f || 'All'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={fetchSubmissions} disabled={loading} className="text-gray-400 hover:text-gray-600 transition">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {submissions.length === 0 && !loading && (
        <div className="bg-white/80 rounded-2xl p-12 text-center text-gray-400">No submissions found</div>
      )}

      <div className="space-y-2">
        {submissions.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s)}
            className="w-full bg-white/90 rounded-xl shadow-sm hover:shadow-md transition p-4 flex items-center gap-4 text-left"
          >
            <img src={s.photoGatewayUrl} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{s.comment}</p>
              <p className="text-xs text-gray-400 font-mono">{s.walletAddress?.slice(0, 10)}...</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                s.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {s.status}
              </span>
              <p className="text-xs text-gray-400 mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
