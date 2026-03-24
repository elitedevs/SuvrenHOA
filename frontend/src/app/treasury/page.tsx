'use client';

export default function TreasuryPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Community Treasury</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Total Balance</h3>
          <p className="text-2xl font-bold">$—</p>
        </div>
        <div className="p-6 rounded-xl border border-green-900/50 bg-green-950/20">
          <h3 className="text-sm text-green-400 mb-1">Operating Fund</h3>
          <p className="text-2xl font-bold text-green-400">$—</p>
        </div>
        <div className="p-6 rounded-xl border border-blue-900/50 bg-blue-950/20">
          <h3 className="text-sm text-blue-400 mb-1">Reserve Fund</h3>
          <p className="text-2xl font-bold text-blue-400">$—</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Expenditures</h2>
      <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-center text-gray-500 py-8">
        <p>No expenditures recorded yet</p>
      </div>
    </div>
  );
}
