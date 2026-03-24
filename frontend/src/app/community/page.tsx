'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Post {
  id: string;
  author: string;
  authorLot: number;
  title: string;
  content: string;
  category: string;
  timestamp: Date;
  replies: number;
  likes: number;
  pinned?: boolean;
}

const CATEGORIES = [
  { id: 'general', label: 'General', icon: '💬', color: 'purple' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧', color: 'amber' },
  { id: 'safety', label: 'Safety & Security', icon: '🛡️', color: 'red' },
  { id: 'events', label: 'Events', icon: '🎉', color: 'green' },
  { id: 'landscaping', label: 'Landscaping', icon: '🌿', color: 'emerald' },
  { id: 'pets', label: 'Pets & Animals', icon: '🐕', color: 'blue' },
  { id: 'recommendations', label: 'Recommendations', icon: '⭐', color: 'yellow' },
  { id: 'lost-found', label: 'Lost & Found', icon: '🔍', color: 'cyan' },
];

// Demo data for presentation
const DEMO_POSTS: Post[] = [
  {
    id: '1', author: '0x48B8...37c78', authorLot: 1, title: 'Pool hours changing for summer',
    content: 'The board has approved extended pool hours starting May 1st. New hours will be 7am-9pm daily. Lifeguard on duty 10am-7pm.',
    category: 'events', timestamp: new Date('2026-03-24'), replies: 8, likes: 23, pinned: true,
  },
  {
    id: '2', author: '0x7A3F...9e2d1', authorLot: 42, title: 'Suspicious activity near the lake trail',
    content: 'Saw an unfamiliar vehicle parked near the lake access around 11pm last night. License plate was partially visible. Has anyone else noticed this?',
    category: 'safety', timestamp: new Date('2026-03-23'), replies: 15, likes: 31,
  },
  {
    id: '3', author: '0x2B91...c4f82', authorLot: 87, title: 'Great electrician recommendation',
    content: 'Just had Mike\'s Electric do our panel upgrade. $2,800 for a full 200A panel swap. Clean work, licensed, and he was on time. Highly recommend.',
    category: 'recommendations', timestamp: new Date('2026-03-22'), replies: 4, likes: 12,
  },
  {
    id: '4', author: '0x5C2D...1a9b3', authorLot: 15, title: 'Lost gray cat - Whiskers',
    content: 'Our gray tabby Whiskers got out last night near lot 15 (Faircroft Dr). He\'s friendly, has a blue collar with tag. Please call or message if you see him!',
    category: 'lost-found', timestamp: new Date('2026-03-22'), replies: 7, likes: 18,
  },
  {
    id: '5', author: '0x8F1E...3d7a6', authorLot: 103, title: 'Sprinkler system flooding sidewalk on Oak Lane',
    content: 'The sprinkler head near lot 103 has been spraying directly onto the sidewalk for the past 3 days. Creating an icy patch in the mornings. Who should I contact?',
    category: 'maintenance', timestamp: new Date('2026-03-21'), replies: 3, likes: 9,
  },
  {
    id: '6', author: '0x3E7B...8c5d2', authorLot: 67, title: 'Community yard sale - April 12th',
    content: 'Organizing a community-wide yard sale for April 12th! Sign up here if you want to participate. We\'ll have signs at the entrance.',
    category: 'events', timestamp: new Date('2026-03-20'), replies: 22, likes: 45,
  },
];

export default function CommunityPage() {
  const { isConnected } = useAccount();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to join the community</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const filteredPosts = selectedCategory
    ? DEMO_POSTS.filter(p => p.category === selectedCategory)
    : DEMO_POSTS;

  const pinnedPosts = filteredPosts.filter(p => p.pinned);
  const regularPosts = filteredPosts.filter(p => !p.pinned);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Community</h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect with your neighbors — discussions, events, recommendations
          </p>
        </div>
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(139,92,246,0.3)] shrink-0"
        >
          {showNewPost ? '← Back' : '✏️ New Post'}
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
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'glass-card text-gray-400 hover:text-gray-300'
              }`}
            >
              All Topics
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'glass-card text-gray-400 hover:text-gray-300'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold mb-3 flex items-center gap-1.5">
                📌 Pinned
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

function PostCard({ post }: { post: Post }) {
  const cat = CATEGORIES.find(c => c.id === post.category);
  const timeAgo = getTimeAgo(post.timestamp);

  return (
    <div className="glass-card rounded-xl p-5 cursor-pointer group">
      <div className="flex items-start gap-4">
        {/* Author avatar */}
        <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400 shrink-0">
          #{post.authorLot}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + Category */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-sm group-hover:text-purple-400 transition-colors">
              {post.title}
            </h3>
            {post.pinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                📌 Pinned
              </span>
            )}
          </div>

          {/* Category + Meta */}
          <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2">
            <span className={`flex items-center gap-1 ${
              cat?.color === 'purple' ? 'text-purple-400' :
              cat?.color === 'red' ? 'text-red-400' :
              cat?.color === 'green' ? 'text-green-400' :
              cat?.color === 'amber' ? 'text-amber-400' :
              cat?.color === 'blue' ? 'text-blue-400' :
              cat?.color === 'emerald' ? 'text-emerald-400' :
              cat?.color === 'yellow' ? 'text-yellow-400' :
              'text-cyan-400'
            }`}>
              {cat?.icon} {cat?.label}
            </span>
            <span>Lot #{post.authorLot}</span>
            <span>{timeAgo}</span>
          </div>

          {/* Content Preview */}
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {post.content}
          </p>

          {/* Engagement */}
          <div className="flex items-center gap-4 mt-3">
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors">
              ❤️ {post.likes}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors">
              💬 {post.replies} replies
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors ml-auto">
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewPostForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <h2 className="text-lg font-semibold">Create a Post</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                category === cat.id
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'glass-card text-gray-400 hover:text-gray-300'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share details with your community..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 transition-all resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={!title.trim() || !content.trim()}
          className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(139,92,246,0.3)]"
        >
          Post to Community
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
