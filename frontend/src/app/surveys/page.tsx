'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SurveysPage() {
  const { isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to participate in surveys</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Surveys & Polls</h1>
          <p className="text-sm text-gray-400 mt-1">
            Community input on decisions, events, and improvements
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all shrink-0"
        >
          {showCreate ? '← Back' : ' Create Poll'}
        </button>
      </div>

      {showCreate ? (
        <CreateSurvey onClose={() => setShowCreate(false)} />
      ) : (
        <SurveyList />
      )}
    </div>
  );
}

function SurveyList() {
  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const res = await fetch('/api/surveys');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading surveys...</div>;

  if (!surveys || surveys.length === 0) {
    return (
      <div className="glass-card rounded-md p-12 text-center">
                <h3 className="text-lg font-medium mb-2">No surveys yet</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Surveys let the board gather community input on everything from pool hours to
          landscaping vendors. Results are transparent and tamper-proof.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 max-w-lg mx-auto">
          <div className="p-3 rounded-lg bg-gray-800/30 text-center">
            <p className="text-[10px] text-gray-400">Quick polls for fast decisions</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/30 text-center">
            <p className="text-[10px] text-gray-400">RSVP for community events</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/30 text-center">
            <p className="text-[10px] text-gray-400">Anonymous feedback option</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {surveys.map((survey: any) => (
        <SurveyCard key={survey.id} survey={survey} />
      ))}
    </div>
  );
}

function SurveyCard({ survey }: { survey: any }) {
  const { address } = useAccount();
  const qc = useQueryClient();
  const options = survey.hoa_survey_options || [];
  const responses = survey.hoa_survey_responses || [];
  const totalVotes = responses.length;
  const hasVoted = responses.some((r: any) => r.wallet_address === address?.toLowerCase());

  const vote = useMutation({
    mutationFn: async (optionId: string) => {
      const res = await fetch('/api/surveys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey_id: survey.id, option_id: optionId, wallet_address: address }),
      });
      if (!res.ok) throw new Error('Failed to vote');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
  });

  const isActive = survey.status === 'active';
  const closesAt = survey.closes_at ? new Date(survey.closes_at) : null;
  const isExpired = closesAt && closesAt < new Date();

  return (
    <div className="glass-card rounded-md p-6">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
          isActive && !isExpired
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}>
          {isActive && !isExpired ? ' Active' : ' Closed'}
        </span>
        <span className="text-[10px] text-gray-500">
          {totalVotes} response{totalVotes !== 1 ? 's' : ''}
        </span>
        {closesAt && (
          <span className="text-[10px] text-gray-500">
            Closes {closesAt.toLocaleDateString()}
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold mb-2">{survey.title}</h3>
      {survey.description && (
        <p className="text-sm text-gray-400 mb-4">{survey.description}</p>
      )}

      {/* Options */}
      <div className="space-y-2">
        {options.sort((a: any, b: any) => a.sort_order - b.sort_order).map((option: any) => {
          const optionVotes = responses.filter((r: any) => r.option_id === option.id).length;
          const percent = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;

          return (
            <button
              key={option.id}
              onClick={() => {
                if (isActive && !isExpired && !hasVoted) {
                  vote.mutate(option.id);
                }
              }}
              disabled={hasVoted || !isActive || !!isExpired || vote.isPending}
              className={`w-full text-left p-3 rounded-md border transition-all relative overflow-hidden ${
                hasVoted
                  ? 'border-gray-800 bg-gray-900/50 cursor-default'
                  : 'border-gray-800 bg-gray-900/50 hover:border-[#c9a96e]/30 cursor-pointer'
              }`}
            >
              {/* Result bar (shown after voting) */}
              {(hasVoted || !isActive || isExpired) && (
                <div
                  className="absolute inset-y-0 left-0 bg-[#c9a96e]/10 transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-sm">{option.label}</span>
                {(hasVoted || !isActive || isExpired) && (
                  <span className="text-xs text-gray-400">{optionVotes} ({percent.toFixed(0)}%)</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-[10px] text-[#c9a96e] mt-3"> You voted</p>
      )}
    </div>
  );
}

function CreateSurvey({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [anonymous, setAnonymous] = useState(false);
  const [closesIn, setClosesIn] = useState('7'); // days

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          created_by: address,
          anonymous,
          closes_in_days: parseInt(closesIn),
          options: options.filter(o => o.trim()),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] });
      onClose();
    },
  });

  const addOption = () => setOptions([...options, '']);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  return (
    <div className="glass-card rounded-md p-6 space-y-5">
      <h2 className="text-lg font-semibold">Create a Poll</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Question</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What should we do about...?"
          className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add context..."
          rows={2}
          className="w-full px-4 py-3 rounded-md bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Options</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-4 py-2.5 rounded-md bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none"
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="px-3 text-gray-500 hover:text-red-400 transition-colors"></button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addOption} className="text-xs text-[#c9a96e] hover:underline mt-2">+ Add option</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Closes in</label>
          <select
            value={closesIn}
            onChange={e => setClosesIn(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
              className="rounded border-gray-700 bg-gray-800"
            />
            <span className="text-sm text-gray-400">Anonymous responses</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-md border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
        <button
          disabled={!title.trim() || options.filter(o => o.trim()).length < 2 || create.isPending}
          onClick={() => create.mutate()}
          className="flex-1 py-3 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all"
        >
          {create.isPending ? ' Creating...' : 'Create Poll'}
        </button>
      </div>
    </div>
  );
}
