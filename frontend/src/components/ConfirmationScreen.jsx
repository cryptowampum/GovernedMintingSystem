import { CheckCircle } from 'lucide-react';

export default function ConfirmationScreen({ submission, onReset }) {
  return (
    <div className="text-center py-8 space-y-6 animate-bounce-in">
      <CheckCircle size={64} className="mx-auto text-green-500" />
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Received!</h2>
        <p className="text-gray-500">Your photo has been submitted for review. An admin will review it shortly.</p>
      </div>
      {submission?.id && (
        <p className="text-xs text-gray-400">Reference: {submission.id}</p>
      )}
      <button
        onClick={onReset}
        className="bg-gradient-brand text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition"
      >
        Submit Another
      </button>
    </div>
  );
}
