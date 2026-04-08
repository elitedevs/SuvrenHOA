import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Share2, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllSlugs, getAllPosts } from '@/lib/blog';
import { createArticleMetadata } from '@/lib/metadata';

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return createArticleMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    publishedTime: post.publishedAt,
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderContent(content: string) {
  const blocks = content.split('\n\n');
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Heading h2
    if (trimmed.startsWith('## ')) {
      const text = trimmed.replace(/^## /, '');
      return (
        <h2 key={i} className="text-2xl font-medium text-[var(--parchment)] mt-10 mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}>
          {text}
        </h2>
      );
    }

    // Heading h3
    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^### /, '');
      return (
        <h3 key={i} className="text-xl font-medium text-[var(--parchment)] mt-8 mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}>
          {text}
        </h3>
      );
    }

    // List items (block of lines starting with -)
    const lines = trimmed.split('\n');
    if (lines.every(l => l.trim().startsWith('- '))) {
      return (
        <ul key={i} className="space-y-2 my-4 ml-4">
          {lines.map((line, j) => (
            <li key={j} className="flex items-start gap-2 text-[rgba(245,240,232,0.65)] leading-relaxed">
              <span className="text-[#B09B71] mt-1.5 shrink-0">&bull;</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^- /, '')) }} />
            </li>
          ))}
        </ul>
      );
    }

    // Table (lines with |)
    if (lines.length >= 2 && lines[0].includes('|') && lines[1].includes('---')) {
      const headerCells = lines[0].split('|').map(c => c.trim()).filter(Boolean);
      const bodyRows = lines.slice(2).filter(l => l.includes('|'));
      return (
        <div key={i} className="my-6 overflow-x-auto rounded-lg"
             style={{ border: '1px solid rgba(245,240,232,0.06)' }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: 'rgba(176,155,113,0.06)' }}>
                {headerCells.map((cell, j) => (
                  <th key={j} className="px-4 py-3 text-left font-medium text-[var(--parchment)] border-b border-[rgba(245,240,232,0.06)]">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, j) => {
                const cells = row.split('|').map(c => c.trim()).filter(Boolean);
                return (
                  <tr key={j} className="border-b border-[rgba(245,240,232,0.04)]">
                    {cells.map((cell, k) => (
                      <td key={k} className="px-4 py-2.5 text-[rgba(245,240,232,0.55)]"
                          dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Numbered list (lines starting with digits)
    if (lines.every(l => /^\d+\.\s/.test(l.trim()))) {
      return (
        <ol key={i} className="space-y-2 my-4 ml-4 list-none">
          {lines.map((line, j) => (
            <li key={j} className="flex items-start gap-3 text-[rgba(245,240,232,0.65)] leading-relaxed">
              <span className="text-[#B09B71] font-medium shrink-0">{j + 1}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, '')) }} />
            </li>
          ))}
        </ol>
      );
    }

    // Regular paragraph
    return (
      <p key={i} className="text-[rgba(245,240,232,0.65)] leading-relaxed my-4"
         dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
    );
  });
}

function formatInline(text: string): string {
  // Bold
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--parchment)] font-medium">$1</strong>');
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex(p => p.slug === post.slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  const shareUrl = `https://suvren.co/blog/${post.slug}`;
  const shareText = encodeURIComponent(post.title);
  const shareUrlEncoded = encodeURIComponent(shareUrl);

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)]">

      {/* ── BACK LINK ─────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 pt-20 page-enter">
        <Link href="/blog"
              className="inline-flex items-center gap-2 text-[13px] text-[rgba(245,240,232,0.40)] hover:text-[#B09B71] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* ── ARTICLE HEADER ────────────────────────────────────────────────── */}
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-10 page-enter page-enter-delay-1">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase mb-6"
              style={{ background: 'rgba(176,155,113,0.1)', color: '#B09B71' }}>
          {post.category}
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-[1.15] mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}>
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-[13px] text-[rgba(245,240,232,0.40)] mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium"
                 style={{ background: 'rgba(176,155,113,0.15)', color: '#B09B71' }}>
              {post.author.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-[var(--parchment)] text-[13px] font-medium">{post.author}</p>
              <p className="text-[11px]">{post.authorRole}</p>
            </div>
          </div>
          <span>&middot;</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span>&middot;</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{post.readingTime}</span>
          </div>
        </div>

        <p className="text-lg text-[rgba(245,240,232,0.55)] leading-relaxed">
          {post.description}
        </p>
      </header>

      {/* ── ARTICLE BODY ──────────────────────────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-6 pb-16 page-enter page-enter-delay-2">
        <div className="border-t border-[rgba(245,240,232,0.06)] pt-10">
          {renderContent(post.content)}
        </div>
      </article>

      {/* ── SHARE ─────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-12 page-enter page-enter-delay-3">
        <div className="border-t border-[rgba(245,240,232,0.06)] pt-8">
          <p className="text-[13px] text-[rgba(245,240,232,0.40)] font-medium mb-4 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share this article
          </p>
          <div className="flex items-center gap-3">
            <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrlEncoded}`}
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-colors hover:text-[#B09B71]"
               style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', color: 'rgba(245,240,232,0.55)' }}>
              <ExternalLink className="w-4 h-4" />
              Twitter
            </a>
            <a href={`https://linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`}
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-colors hover:text-[#B09B71]"
               style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', color: 'rgba(245,240,232,0.55)' }}>
              <ExternalLink className="w-4 h-4" />
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="rounded-xl p-8 text-center relative overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, rgba(176,155,113,0.08) 0%, rgba(42,93,79,0.06) 100%)',
               border: '1px solid rgba(176,155,113,0.15)',
             }}>
          <h3 className="text-xl font-medium text-[var(--parchment)] mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Ready to bring transparency to your HOA?
          </h3>
          <p className="text-[13px] text-[rgba(245,240,232,0.45)] mb-5">
            60-day free trial. No credit card required. Setup in under 5 minutes.
          </p>
          <Link href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                  color: '#0C0C0E',
                  boxShadow: '0 0 24px rgba(176,155,113,0.25)',
                }}>
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── PREV / NEXT ───────────────────────────────────────────────────── */}
      <nav className="max-w-3xl mx-auto px-6 pb-24">
        <div className="border-t border-[rgba(245,240,232,0.06)] pt-8 grid grid-cols-2 gap-4">
          {prevPost ? (
            <Link href={`/blog/${prevPost.slug}`}
                  className="group rounded-xl p-5 hover-lift transition-all"
                  style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
              <p className="text-[11px] text-[rgba(245,240,232,0.30)] uppercase tracking-wide mb-2 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Previous
              </p>
              <p className="text-[14px] font-medium text-[var(--parchment)] group-hover:text-[#B09B71] transition-colors line-clamp-2"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                {prevPost.title}
              </p>
            </Link>
          ) : <div />}
          {nextPost ? (
            <Link href={`/blog/${nextPost.slug}`}
                  className="group rounded-xl p-5 text-right hover-lift transition-all"
                  style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
              <p className="text-[11px] text-[rgba(245,240,232,0.30)] uppercase tracking-wide mb-2 flex items-center justify-end gap-1">
                Next <ArrowRight className="w-3 h-3" />
              </p>
              <p className="text-[14px] font-medium text-[var(--parchment)] group-hover:text-[#B09B71] transition-colors line-clamp-2"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                {nextPost.title}
              </p>
            </Link>
          ) : <div />}
        </div>
      </nav>
    </div>
  );
}
