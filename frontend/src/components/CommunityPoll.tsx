'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePolls } from '@/hooks/usePolls';

export function CommunityPoll() {
  const { address } = useAccount();
  const { activePolls, archivedPolls, vote, createPoll, archivePoll } = usePolls();
  const [showArchive, setShowArchive] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);

  const displayPolls = showArchive ? archivedPolls : activePolls;
  const pinnedFirst = [...displayPolls].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium">Community Polls</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowArchive(!showArchive)}
            className="text-xs text-[var(--text-muted)] hover:text-[#B09B71] transition-colors">
            {showArchive ? 'Active' : `Archive (${archivedPolls.length})`}
          </button>
          <button onClick={() => setShowCreate(!showCreate)}
            className="text-xs text-[#B09B71] hover:text-[#D4C4A0] transition-colors">
            {showCreate ? 'Cancel' : '+ New'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 rounded-xl bg-[rgba(26,26,30,0.30)] border border-[rgba(245,240,232,0.08)] space-y-3">
          <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
            placeholder="Poll question..." className="w-full px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
          {newOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input value={opt} onChange={e => { const o = [...newOptions]; o[i] = e.target.value; setNewOptions(o); }}
                placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
              {newOptions.length > 2 && (
                <button onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))} className="text-[var(--text-disabled)] hover:text-[#8B5A5A]"></button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setNewOptions([...newOptions, ''])} className="text-xs text-[#B09B71] hover:underline">+ Option</button>
            <button onClick={() => {
              if (newQuestion && newOptions.filter(o => o.trim()).length >= 2 && address) {
                createPoll(newQuestion, newOptions.filter(o => o.trim()), address);
                setNewQuestion('');
                setNewOptions(['', '']);
                setShowCreate(false);
              }
            }} className="ml-auto px-4 py-1.5 rounded-lg bg-[#B09B71] text-[var(--surface-2)] text-xs font-medium">
              Create Poll
            </button>
          </div>
        </div>
      )}

      {pinnedFirst.length === 0 ? (
        <p className="text-sm text-[var(--text-disabled)] text-center py-4">{showArchive ? 'No archived polls' : 'No active polls'}</p>
      ) : (
        <div className="space-y-4">
          {pinnedFirst.map(poll => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
            const hasVoted = address ? poll.options.some(o => o.votes.includes(address)) : false;
            const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false;

            return (
              <div key={poll.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">
                    {poll.pinned && <span className="text-[#B09B71] mr-1"></span>}
                    {poll.question}
                  </p>
                  {!showArchive && !isExpired && address && (
                    <button onClick={() => archivePoll(poll.id)} className="text-[10px] text-[var(--text-disabled)] hover:text-[var(--text-muted)] shrink-0">archive</button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {poll.options.map(option => {
                    const pct = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                    const canVote = !hasVoted && !isExpired && !showArchive && address;
                    return (
                      <button key={option.id} onClick={() => canVote && vote(poll.id, option.id, address!)}
                        disabled={!canVote}
                        className={`w-full text-left relative overflow-hidden rounded-lg transition-all ${
                          canVote ? 'hover:border-[rgba(176,155,113,0.30)] cursor-pointer' : 'cursor-default'
                        } border border-[rgba(245,240,232,0.06)] bg-[rgba(20,20,22,0.50)]`}>
                        <div className="absolute inset-y-0 left-0 bg-[rgba(176,155,113,0.10)] transition-all duration-700 rounded-lg"
                          style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between px-3 py-2">
                          <span className="text-xs text-[var(--text-body)]">{option.label}</span>
                          {(hasVoted || isExpired || showArchive) && (
                            <span className="text-[10px] text-[var(--text-muted)]">{option.votes.length} · {pct.toFixed(0)}%</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[var(--text-disabled)]">
                  {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                  {hasVoted && <span className="text-[#B09B71] ml-2">· You voted</span>}
                  {poll.expiresAt && <span className="ml-2">· {isExpired ? 'Closed' : `Closes ${new Date(poll.expiresAt).toLocaleDateString()}`}</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
