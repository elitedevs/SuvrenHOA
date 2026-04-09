import Link from 'next/link';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { getAllPosts } from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';

export const metadata = createMetadata({
  title: 'Blog',
  description: 'Insights on HOA governance, transparency, and blockchain technology from the SuvrenHOA team.',
  path: '/blog',
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase"
          style={{ background: 'rgba(176,155,113,0.1)', color: '#B09B71' }}>
      {category}
    </span>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}
          className="group rounded-xl p-6 flex flex-col hover-lift transition-all"
          style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
      <CategoryBadge category={post.category} />
      <h3 className="text-lg font-medium text-[var(--parchment)] mt-3 mb-2 group-hover:text-[#B09B71] transition-colors"
          style={{ fontFamily: 'var(--font-heading)' }}>
        {post.title}
      </h3>
      <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed mb-4 flex-1">
        {post.description}
      </p>
      <div className="flex items-center justify-between text-[12px] text-[rgba(245,240,232,0.35)]">
        <div className="flex items-center gap-3">
          <span>{post.author}</span>
          <span>&middot;</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{post.readingTime}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.04)]">
        <span className="text-[13px] text-[#B09B71] font-medium group-hover:gap-2 inline-flex items-center gap-1 transition-all">
          Read more <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 page-enter">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text">Insights &amp; Updates</span>
          </h1>
          <p className="text-lg text-[rgba(245,240,232,0.45)] max-w-2xl mx-auto">
            Perspectives on HOA governance, financial transparency, and the technology making communities more accountable.
          </p>
        </div>
      </section>

      {/* ── FEATURED POST ─────────────────────────────────────────────────── */}
      {featured && (
        <section className="pb-16 page-enter page-enter-delay-1">
          <div className="max-w-5xl mx-auto px-6">
            <Link href={`/blog/${featured.slug}`}
                  className="group rounded-xl p-8 md:p-10 block hover-lift transition-all relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(176,155,113,0.06) 0%, rgba(42,93,79,0.06) 100%)',
                    border: '1px solid rgba(176,155,113,0.15)',
                  }}>
              <div className="absolute inset-0 pointer-events-none"
                   style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(176,155,113,0.08) 0%, transparent 60%)' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <CategoryBadge category={featured.category} />
                  <span className="text-[11px] font-medium tracking-wide uppercase text-[#2A5D4F]">Featured</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium text-[var(--parchment)] mb-3 group-hover:text-[#B09B71] transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                  {featured.title}
                </h2>
                <p className="text-[rgba(245,240,232,0.50)] max-w-2xl mb-6 leading-relaxed">
                  {featured.description}
                </p>
                <div className="flex items-center gap-4 text-[13px] text-[rgba(245,240,232,0.35)]">
                  <span>{featured.author}</span>
                  <span>&middot;</span>
                  <span>{formatDate(featured.publishedAt)}</span>
                  <span>&middot;</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{featured.readingTime}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-2 text-[#B09B71] font-medium text-sm group-hover:gap-3 transition-all">
                    Read more <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── POST GRID ─────────────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <section className="pb-24 page-enter page-enter-delay-2">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ───────────────────────────────────────────────────── */}
      {posts.length === 0 && (
        <section className="pb-32 page-enter page-enter-delay-1">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div
              className="h-px w-24 mx-auto mb-10"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(176,155,113,0.55) 50%, transparent 100%)' }}
              aria-hidden="true"
            />
            <p
              className="italic text-[26px] sm:text-[30px] leading-[1.45] text-[rgba(245,240,232,0.72)] mb-6"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              The first essay is still being written.
            </p>
            <p className="italic text-[15px] text-[rgba(245,240,232,0.42)] leading-relaxed max-w-md mx-auto"
               style={{ fontFamily: 'var(--font-heading)' }}>
              When we have something worth saying, you&apos;ll find it here. Until then, the quiet is intentional.
            </p>
            <div className="mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[13px] text-[#B09B71] hover:text-[#D4C4A0] transition-colors uppercase tracking-[0.15em]"
              >
                Return home <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
