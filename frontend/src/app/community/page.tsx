'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePosts, useCreatePost, type Post as PostType } from '@/hooks/usePosts';
import { useProperty } from '@/hooks/useProperty';


const CATEGORIES = [
  { id: 'general', label: 'General', icon: '', color: 'gold' },
  { id: 'maintenance', label: 'Maintenance', icon: '', color: 'amber' },
  { id: 'safety', label: 'Safety & Security', icon: '', color: 'red' },
  { id: 'events', label: 'Events', icon: '', color: 'green' },
  { id: 'landscaping', label: 'Landscaping', icon: '', color: 'emerald' },
  { id: 'pets', label: 'Pets & Animals', icon: '', color: 'blue' },
  { id: 'recommendations', label: 'Recommendations', icon: '', color: 'yellow' },
  { id: 'lost-found', label: 'Lost & Found', icon: '', color: 'cyan' },
];

// Demo data for presentation


export default function CommunityPage() {
  const { isConnected } = useAccount();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to join the community</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const { data: apiPosts, isLoading } = usePosts(selectedCategory);
  const posts = apiPosts || [];

  const pinnedPosts = posts.filter((p: any) => p.pinned);
  const regularPosts = posts.filter((p: any) => !p.pinned);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Community</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Connect with your neighbors — discussions, events, recommendations
          </p>
        </div>
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          className="px-5 py-2.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(201,169,110,0.25)] shrink-0"
        >
          {showNewPost ? '← Back' : 'New Post'}
        </button>
      </div>

      {showNewPost ? (
        <NewPostForm onClose={() => setShowNewPost(false)} />
      ) : (
        <>
          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30'
                  : 'glass-card text-[var(--text-muted)] hover:text-[var(--text-body)]'
              }`}
            >
              All Topics
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30'
                    : 'glass-card text-[var(--text-muted)] hover:text-[var(--text-body)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-wider text-[#B09B71] font-medium mb-3 flex items-center gap-1.5">
                Pinned
              </p>
              {pinnedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Regular Posts */}
          <div className="space-y-3">
            {regularPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const cat = CATEGORIES.find(c => c.id === post.category);
  const timeAgo = getTimeAgo(new Date(post.created_at));

  return (
    <div className="glass-card rounded-lg p-5 cursor-pointer group">
      <div className="flex items-start gap-4">
        {/* Author avatar */}
        <div className="w-10 h-10 rounded-full bg-[#B09B71]/15 border border-[#B09B71]/20 flex items-center justify-center text-xs font-medium text-[#B09B71] shrink-0">
          #{post.lot_number || 0}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + Category */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-medium text-sm group-hover:text-[#B09B71] transition-colors">
              {post.title}
            </h3>
            {post.pinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B09B71]/10 text-[#B09B71] border border-[#B09B71]/20">
                Pinned
              </span>
            )}
          </div>

          {/* Category + Meta */}
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-disabled)] mb-2">
            <span className={`flex items-center gap-1 ${
              cat?.color === 'gold' ? 'text-[#B09B71]' :
              cat?.color === 'red' ? 'text-[#8B5A5A]' :
              cat?.color === 'green' ? 'text-[#3A7D6F]' :
              cat?.color === 'amber' ? 'text-[#B09B71]' :
              cat?.color === 'blue' ? 'text-[#B09B71]' :
              cat?.color === 'emerald' ? 'text-[#3A7D6F]' :
              cat?.color === 'yellow' ? 'text-[#B09B71]' :
              'text-[#B09B71]'
            }`}>
              {cat?.label}
            </span>
            <span>Lot #{post.lot_number || 0}</span>
            <span>{timeAgo}</span>
          </div>

          {/* Content Preview */}
          <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {post.content}
          </p>

          {/* Engagement */}
          <div className="flex items-center gap-4 mt-3">
            <button className="flex items-center gap-1.5 text-xs text-[var(--text-disabled)] hover:text-[#B09B71] transition-colors">
              {post.likes_count || 0} likes
            </button>
            <button className="flex items-center gap-1.5 text-xs text-[var(--text-disabled)] hover:text-[#B09B71] transition-colors">
              {post.replies_count || 0} replies
            </button>
            <button className="flex items-center gap-1.5 text-xs text-[var(--text-disabled)] hover:text-[#B09B71] transition-colors ml-auto">
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewPostForm({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const createPost = useCreatePost();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');

  return (
    <div className="glass-card rounded-lg p-6 space-y-5">
      <h2 className="text-lg font-medium">Create a Post</h2>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                category === cat.id
                  ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30'
                  : 'glass-card text-[var(--text-muted)] hover:text-[var(--text-body)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[#B09B71]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B09B71]/20 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share details with your community..."
          rows={5}
          className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[#B09B71]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B09B71]/20 transition-all resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-lg border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={!title.trim() || !content.trim() || createPost.isPending}
          onClick={() => {
            if (!address) return;
            createPost.mutate(
              { wallet_address: address, lot_number: tokenId, title, content, category },
              { onSuccess: () => onClose() }
            );
          }}
          className="flex-1 py-3 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(201,169,110,0.25)]"
        >
          {createPost.isPending ? 'Posting...' : 'Post to Community'}
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
