'use client';

export default function ProposalsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-medium transition-colors">
          + New Proposal
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-center text-gray-500 py-12">
          <p className="text-lg mb-2">📋</p>
          <p>No proposals yet</p>
          <p className="text-sm">Proposals will appear here once the contracts are deployed</p>
        </div>
      </div>
    </div>
  );
}
