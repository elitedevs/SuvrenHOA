'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePosts, useCreatePost, type Post as PostType } from '@/hooks/usePosts';
import { useProperty } from '@/hooks/useProperty';
import Link from 'next/link';
import {
  Vote, DollarSign, FileText, Shield, MessageSquare,
  ExternalLink, BookOpen, Users,
} from 'lucide-react';


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

  const { data: apiPosts, isLoading } = usePosts(selectedCategory);

  if (!isConnected) {
    return <CommunityPublicPage />;
  }
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
                  ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]'
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
                    ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]'
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

          {/* Empty state */}
          {!isLoading && posts.length === 0 && (
            <div className="glass-card rounded-xl p-10 text-center mt-4">
              <div className="w-14 h-14 rounded-xl bg-[rgba(176,155,113,0.08)] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-[var(--text-heading)] mb-2">No posts yet</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-5">
                Be the first to start a conversation! Share a recommendation, report an issue, or just say hello to your neighbors.
              </p>
              <button
                onClick={() => setShowNewPost(true)}
                className="px-5 py-2.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(201,169,110,0.25)]"
              >
                Create First Post
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-3 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[rgba(245,240,232,0.05)] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-2/3 rounded bg-[rgba(245,240,232,0.05)] animate-pulse" />
                      <div className="h-3 w-1/3 rounded bg-[rgba(245,240,232,0.04)] animate-pulse" />
                      <div className="h-3 w-full rounded bg-[rgba(245,240,232,0.03)] animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <div className="w-10 h-10 rounded-full bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.20)] flex items-center justify-center text-xs font-medium text-[#B09B71] shrink-0">
          #{post.lot_number || 0}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + Category */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-medium text-sm group-hover:text-[#B09B71] transition-colors">
              {post.title}
            </h3>
            {post.pinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(176,155,113,0.10)] text-[#B09B71] border border-[rgba(176,155,113,0.20)]">
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
                  ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]'
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
          className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(176,155,113,0.20)] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share details with your community..."
          rows={5}
          className="w-full px-4 py-3 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(176,155,113,0.20)] transition-all resize-none"
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

function CommunityPublicPage() {
  const GOVERNANCE_PILLARS = [
    {
      icon: Vote,
      title: 'Democratic Voting',
      desc: 'Every proposal goes to a community-wide vote. Results are recorded on the blockchain the moment polls close — no one can alter them.',
    },
    {
      icon: DollarSign,
      title: 'Transparent Finances',
      desc: 'Every dollar collected and spent is visible to every resident in real time. No off-books transactions. No hidden fees.',
    },
    {
      icon: FileText,
      title: 'Immutable Records',
      desc: 'Meeting minutes, bylaws, and governing documents are stored on Arweave permanently. They can never be lost, edited, or deleted.',
    },
    {
      icon: Shield,
      title: 'Cryptographic Accountability',
      desc: 'Board actions are tied to verified wallets. Every decision has a timestamped, on-chain audit trail — accountability by design.',
    },
  ];

  const GUIDELINES = [
    { rule: 'Be respectful', detail: 'Disagreement is fine. Personal attacks, harassment, or discrimination are not tolerated.' },
    { rule: 'Stay on topic', detail: 'Keep posts relevant to your community. Off-topic content may be moved or removed.' },
    { rule: 'No spam', detail: 'No commercial promotions, repeated posts, or unsolicited advertising.' },
    { rule: 'Protect privacy', detail: "Don't share other residents' personal information without consent." },
    { rule: "Report, don't retaliate", detail: "If you see rule violations, report them to your board. Don't escalate publicly." },
    { rule: 'Be constructive', detail: 'If you raise a problem, try to suggest a solution. Community improvement is everyone\'s job.' },
  ];

  const TESTIMONIALS = [
    {
      quote: "Our last board president changed the meeting minutes three times in one year. With SuvrenHOA, that's impossible now.",
      name: 'Sarah M.',
      role: 'Board Member',
      community: 'Oakwood Heights HOA',
      initials: 'SM',
    },
    {
      quote: "Residents finally trust where their dues are going. Participation in our annual vote went from 22% to 74% in one year.",
      name: 'James R.',
      role: 'Board President',
      community: 'Lakeside Commons',
      initials: 'JR',
    },
    {
      quote: "Setup took less than an afternoon. Our documents are now permanent, our votes are now fair, and our neighbors are finally engaged.",
      name: 'Patricia L.',
      role: 'Property Manager',
      community: 'Willow Creek HOA',
      initials: 'PL',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[#E8E4DC] mb-4">
            Community Built on Trust
          </h1>
          <p className="text-lg text-[#C4BAA8] leading-relaxed mb-8">
            SuvrenHOA is more than software — it's a new model for how neighbors govern together. Transparent by default. Democratic by design. Permanent by technology.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#B09B71] to-[#8A7A55] text-[#0C0C0E] font-bold px-6 py-3 rounded-xl hover:from-[#C4B080] hover:to-[#9A8A65] transition-all"
            >
              Join Your Community
            </Link>
            <Link
              href="/founding"
              className="inline-flex items-center gap-2 border border-[#B09B71]/40 text-[#B09B71] px-6 py-3 rounded-xl hover:border-[#B09B71] transition-colors text-sm font-medium"
            >
              Founding Program →
            </Link>
          </div>
        </div>
      </section>

      {/* Governance explainer */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl font-bold text-[#E8E4DC] mb-3">How Governance Works</h2>
            <p className="text-[#8A8070] max-w-xl mx-auto">
              Traditional HOAs run on spreadsheets and good intentions. SuvrenHOA runs on math.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {GOVERNANCE_PILLARS.map(p => (
              <div key={p.title} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 hover:border-[#B09B71]/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#B09B71]/10 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-[#B09B71]" />
                </div>
                <h3 className="font-semibold text-[#E8E4DC] mb-2">{p.title}</h3>
                <p className="text-sm text-[#8A8070] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discord / Community hub */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#141416] border border-[#2A2A2E] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-7 h-7 text-[#5865F2]" />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-3">Join the Conversation</h2>
            <p className="text-[#8A8070] leading-relaxed mb-6 max-w-lg mx-auto">
              Our Discord community connects HOA board members, property managers, and residents who are reimagining community governance. Share experiences, get help, shape the product.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://discord.gg/suvren"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#5865F2] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#4752C4] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Join Discord
              </a>
              <span className="text-sm text-[#4A4A52]">Coming soon — join waitlist to get notified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Community guidelines */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-5 h-5 text-[#B09B71]" />
            <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC]">Community Guidelines</h2>
          </div>
          <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl divide-y divide-[#2A2A2E]">
            {GUIDELINES.map((g, i) => (
              <div key={g.rule} className="flex items-start gap-4 px-5 py-4">
                <span className="text-xs font-bold text-[#B09B71] font-mono mt-0.5 flex-shrink-0 w-5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#E8E4DC] mb-0.5">{g.rule}</p>
                  <p className="text-sm text-[#8A8070]">{g.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#4A4A52] mt-3">
            Violations may result in post removal or account suspension. Board members moderate their own communities.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Users className="w-5 h-5 text-[#B09B71]" />
            <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC]">What Communities Say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 flex flex-col">
                <p className="text-sm text-[#C4BAA8] leading-relaxed italic mb-6 flex-1">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#B09B71]/15 border border-[#B09B71]/30 flex items-center justify-center text-xs font-bold text-[#B09B71]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E8E4DC]">{t.name}</p>
                    <p className="text-xs text-[#4A4A52]">{t.role} · {t.community}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#4A4A52] text-center mt-6">
            Testimonials are representative placeholders — real community stories coming at launch.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-4">Ready to Join?</h2>
          <p className="text-[#8A8070] mb-8">Sign in with your community invite, or apply for the Founding Program.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#B09B71] to-[#8A7A55] text-[#0C0C0E] font-bold px-6 py-3 rounded-xl hover:from-[#C4B080] hover:to-[#9A8A65] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/founding"
              className="inline-flex items-center gap-2 border border-[#2A2A2E] text-[#C4BAA8] px-6 py-3 rounded-xl hover:border-[#B09B71]/40 transition-colors text-sm font-medium"
            >
              Apply for Founding
            </Link>
          </div>
        </div>
      </section>
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
