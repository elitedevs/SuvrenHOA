'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useForumPosts, ForumTopic } from '@/hooks/useForumPosts';
import { useProfile } from '@/hooks/useProfile';
import { useProperty } from '@/hooks/useProperty';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

const CATEGORIES = ['All', 'Announcements', 'Amenities', 'Maintenance', 'Governance', 'General', 'Events'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ForumPage() {
  const { isConnected } = useAccount();
  const { topics, isLoaded, createTopic, addReply } = useForumPosts();
  const { displayName } = useProfile();
  const { tokenId } = useProperty();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const filtered = topics.filter(t =>
    selectedCategory === 'All' || t.category === selectedCategory
  );

  // Sort: pinned first, then by date
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateTopic = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    createTopic({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      author: displayName || 'Anonymous',
      lotNumber: tokenId ?? undefined,
    });
    setNewTitle('');
    setNewContent('');
    setNewCategory('General');
    setShowCreate(false);
    setSubmitting(false);
  };

  const handleReply = (topic: ForumTopic) => {
    if (!replyText.trim()) return;
    addReply(topic.id, {
      content: replyText.trim(),
      author: displayName || 'Anonymous',
      lotNumber: tokenId ?? undefined,
    });
    setReplyText('');
    // Refresh selected topic
    setSelectedTopic(prev => prev ? {
      ...prev,
      replies: [...prev.replies, {
        id: `r-${Date.now()}`,
        topicId: prev.id,
        content: replyText.trim(),
        author: displayName || 'Anonymous',
        lotNumber: tokenId ?? undefined,
        createdAt: new Date().toISOString(),
      }],
    } : null);
  };

  if (selectedTopic) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
        <button onClick={() => setSelectedTopic(null)} className="text-gray-500 hover:text-[#c9a96e] text-sm transition-colors mb-4">
          ← Back to Forum
        </button>

        {/* Topic header */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20 font-semibold shrink-0">
              {selectedTopic.category}
            </span>
            {selectedTopic.pinned && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold shrink-0">
                 Pinned
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-3">{selectedTopic.title}</h1>
          <p className="text-sm text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">{selectedTopic.content}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="font-medium text-[#c9a96e]">{selectedTopic.author}</span>
            {selectedTopic.lotNumber && <span>· Lot #{selectedTopic.lotNumber}</span>}
            <span>· {timeAgo(selectedTopic.createdAt)}</span>
          </div>
        </div>

        {/* Replies */}
        {selectedTopic.replies.length > 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
              {selectedTopic.replies.length} {selectedTopic.replies.length === 1 ? 'Reply' : 'Replies'}
            </p>
            {selectedTopic.replies.map(reply => (
              <div key={reply.id} className="glass-card rounded-xl p-4 border-l-2 border-l-[#c9a96e]/20">
                <p className="text-sm text-gray-300 leading-relaxed mb-2 whitespace-pre-wrap">{reply.content}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="font-medium text-[#c9a96e]">{reply.author}</span>
                  {reply.lotNumber && <span>· Lot #{reply.lotNumber}</span>}
                  <span>· {timeAgo(reply.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply form */}
        {isConnected ? (
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Post a Reply</p>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none resize-none mb-3"
            />
            <button
              onClick={() => handleReply(selectedTopic)}
              disabled={!replyText.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-40 text-sm font-medium transition-all"
            >
              Post Reply
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-3">Sign in to reply</p>
            <ConnectButton label="Sign In" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Community</p>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2"><MessageSquare className="w-7 h-7 text-[#c9a96e]" /> Discussion Forum</h1>
          <p className="text-base text-gray-400 mt-2">Community discussions, questions, and announcements</p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-bold transition-all shrink-0"
          >
            {showCreate ? '← Back' : '+ New Topic'}
          </button>
        )}
      </div>

      {showCreate ? (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold mb-5">New Discussion Topic</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      newCategory === cat
                        ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
                        : 'bg-gray-800/40 text-gray-400 border border-gray-700/40 hover:border-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Message</label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Share more details..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateTopic}
                disabled={!newTitle.trim() || !newContent.trim() || submitting}
                className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-40 text-sm font-bold transition-all"
              >
                Post Topic
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
                : 'bg-gray-800/40 text-gray-400 border border-gray-700/40 hover:border-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {!isLoaded ? (
        <div className="text-center py-12 text-gray-500">Loading discussions...</div>
      ) : sorted.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400">No topics yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(topic => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className="w-full text-left glass-card rounded-2xl hover-lift p-5 transition-all hover:border-[#c9a96e]/20 group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {topic.pinned && <span className="text-[10px] text-amber-400"></span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/15 font-medium">
                      {topic.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100 group-hover:text-[#e8d5a3] transition-colors leading-snug mb-1.5">
                    {topic.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{topic.content}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-lg font-bold text-gray-300">{topic.replies.length}</div>
                  <div className="text-[10px] text-gray-500">replies</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-500">
                <span className="text-[#c9a96e] font-medium">{topic.author}</span>
                {topic.lotNumber && <span>· Lot #{topic.lotNumber}</span>}
                <span>· {timeAgo(topic.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
