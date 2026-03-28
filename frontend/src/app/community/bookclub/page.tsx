'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  BookOpen, ThumbsUp, MessageSquare, Plus, ChevronRight, Star, Archive, Vote, X,
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  month: string;
  year: number;
  synopsis: string;
  pages: number;
  status: 'current' | 'upcoming' | 'past';
  votes?: number;
}

interface Thread {
  id: string;
  bookId: string;
  author: string;
  lot: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface Nomination {
  id: string;
  title: string;
  author: string;
  nominatedBy: string;
  votes: string[];
}

const DEMO_BOOKS: Book[] = [
  { id: '1', title: 'The Lincoln Highway', author: 'Amor Towles', coverColor: 'from-blue-900 to-blue-700', month: 'March', year: 2026, synopsis: 'A beautifully crafted novel about an 18-day journey across America in the 1950s, full of adventure, wit, and heart.', pages: 592, status: 'current' },
  { id: '2', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', coverColor: 'from-purple-900 to-pink-700', month: 'February', year: 2026, synopsis: 'A story of friendship, love, and the creative industry of video games spanning three decades.', pages: 416, status: 'past' },
  { id: '3', title: 'Demon Copperhead', author: 'Barbara Kingsolver', coverColor: 'from-orange-900 to-red-700', month: 'January', year: 2026, synopsis: 'A Pulitzer Prize-winning retelling of David Copperfield set in modern Appalachia.', pages: 560, status: 'past' },
];

const DEMO_THREADS: Thread[] = [
  { id: '1', bookId: '1', author: 'Eleanor W.', lot: '3', content: 'The characters feel so real! Towles has such a gift for voice. Who else is rooting for Emmett?', timestamp: '2026-03-24T14:30:00Z', likes: 5 },
  { id: '2', bookId: '1', author: 'Marcus B.', lot: '2', content: 'The structure with the 10 days is genius. Each day reveals a new layer. Finished it in 3 sittings!', timestamp: '2026-03-23T19:00:00Z', likes: 3 },
  { id: '3', bookId: '2', author: 'Sarah K.', lot: '6', content: 'One of the best books I\'ve read in years. The friendship felt so authentic.', timestamp: '2026-02-28T20:00:00Z', likes: 7 },
];

const DEMO_NOMINATIONS: Nomination[] = [
  { id: '1', title: 'The Women', author: 'Kristin Hannah', nominatedBy: 'Lot 12', votes: ['12', '34', '56', '88'] },
  { id: '2', title: 'James', author: 'Percival Everett', nominatedBy: 'Lot 20', votes: ['20', '42', '7'] },
  { id: '3', title: 'All Fours', author: 'Miranda July', nominatedBy: 'Lot 67', votes: ['67', '5'] },
];

const COVER_COLORS = [
  'from-blue-900 to-blue-700', 'from-purple-900 to-pink-700', 'from-green-900 to-emerald-700',
  'from-orange-900 to-red-700', 'from-cyan-900 to-teal-700', 'from-yellow-900 to-amber-700',
];

export default function BookClubPage() {
  const { isConnected } = useAccount();
  const [books, setBooks] = useState<Book[]>(DEMO_BOOKS);
  const [threads, setThreads] = useState<Thread[]>(DEMO_THREADS);
  const [nominations, setNominations] = useState<Nomination[]>(DEMO_NOMINATIONS);
  const [tab, setTab] = useState<'current' | 'discuss' | 'nominate' | 'archive'>('current');
  const [newComment, setNewComment] = useState('');
  const [newNomTitle, setNewNomTitle] = useState('');
  const [newNomAuthor, setNewNomAuthor] = useState('');
  const [myLot] = useState('42');

  useEffect(() => {
    const bd = localStorage.getItem('hoa_bookclub_books');
    if (bd) { try { setBooks(JSON.parse(bd)); } catch {} }
    const td = localStorage.getItem('hoa_bookclub_threads');
    if (td) { try { setThreads(JSON.parse(td)); } catch {} }
    const nd = localStorage.getItem('hoa_bookclub_nominations');
    if (nd) { try { setNominations(JSON.parse(nd)); } catch {} }
  }, []);

  const currentBook = books.find((b) => b.status === 'current');
  const currentThreads = threads.filter((t) => t.bookId === currentBook?.id);

  const postComment = () => {
    if (!newComment.trim() || !currentBook) return;
    const t: Thread = {
      id: Date.now().toString(),
      bookId: currentBook.id,
      author: `Lot ${myLot}`,
      lot: myLot,
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    const updated = [t, ...threads];
    setThreads(updated);
    localStorage.setItem('hoa_bookclub_threads', JSON.stringify(updated));
    setNewComment('');
  };

  const likeThread = (id: string) => {
    const updated = threads.map((t) => t.id === id ? { ...t, likes: t.likes + 1 } : t);
    setThreads(updated);
    localStorage.setItem('hoa_bookclub_threads', JSON.stringify(updated));
  };

  const vote = (nomId: string) => {
    const updated = nominations.map((n) => {
      if (n.id !== nomId) return n;
      const hasVoted = n.votes.includes(myLot);
      return { ...n, votes: hasVoted ? n.votes.filter((v) => v !== myLot) : [...n.votes, myLot] };
    });
    setNominations(updated);
    localStorage.setItem('hoa_bookclub_nominations', JSON.stringify(updated));
  };

  const addNomination = () => {
    if (!newNomTitle.trim()) return;
    const n: Nomination = {
      id: Date.now().toString(),
      title: newNomTitle,
      author: newNomAuthor,
      nominatedBy: `Lot ${myLot}`,
      votes: [myLot],
    };
    const updated = [...nominations, n];
    setNominations(updated);
    localStorage.setItem('hoa_bookclub_nominations', JSON.stringify(updated));
    setNewNomTitle('');
    setNewNomAuthor('');
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to join the book club</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const TABS = [
    { id: 'current', label: 'This Month', icon: BookOpen },
    { id: 'discuss', label: 'Discussion', icon: MessageSquare },
    { id: 'nominate', label: 'Next Month', icon: Vote },
    { id: 'archive', label: 'Past Reads', icon: Archive },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-[#B09B71]" />
          Community Book Club
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Monthly reads, discussions, and what's next</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              tab === id ? 'bg-[#B09B71] text-[var(--surface-2)]' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'current' && currentBook && (
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 border border-[#B09B71]/20">
            <div className="flex gap-5">
              <div className={`w-24 h-32 rounded-xl bg-gradient-to-b ${currentBook.coverColor} border border-[rgba(245,240,232,0.10)] shrink-0 flex items-center justify-center`}>
                <BookOpen className="w-8 h-8 text-[rgba(245,240,232,0.50)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#B09B71]/15 text-[#B09B71] font-medium border border-[#B09B71]/20">
                    {currentBook.month} {currentBook.year}
                  </span>
                  <Star className="w-4 h-4 text-[#B09B71] fill-[#B09B71]" />
                  <span className="text-xs text-[#B09B71] font-medium">This Month's Pick</span>
                </div>
                <h2 className="text-xl font-medium text-[var(--text-heading)]">{currentBook.title}</h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">by {currentBook.author}</p>
                <p className="text-sm text-[var(--text-body)] mt-3 leading-relaxed">{currentBook.synopsis}</p>
                <p className="text-xs text-[var(--text-disabled)] mt-2">{currentBook.pages} pages</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'discuss' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Share your thoughts on "${currentBook?.title}"...`}
              rows={3}
              className="w-full bg-transparent text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={postComment}
                className="px-4 py-1.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-xs font-medium transition-colors"
              >
                Post
              </button>
            </div>
          </div>
          {currentThreads.map((thread) => (
            <div key={thread.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#B09B71]">{thread.author}</span>
                <span className="text-xs text-[var(--text-disabled)]">{new Date(thread.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-[var(--text-body)]">{thread.content}</p>
              <button onClick={() => likeThread(thread.id)} className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-disabled)] hover:text-[#B09B71] transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" />
                {thread.likes}
              </button>
            </div>
          ))}
          {currentThreads.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center">
              <MessageSquare className="w-8 h-8 text-[var(--text-disabled)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">No discussion yet — start the conversation!</p>
            </div>
          )}
        </div>
      )}

      {tab === 'nominate' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 border border-[#B09B71]/20">
            <h3 className="text-sm font-medium text-[var(--text-heading)] mb-3">Nominate a Book</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newNomTitle}
                onChange={(e) => setNewNomTitle(e.target.value)}
                placeholder="Book title"
                className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:border-[#B09B71]/50 focus:outline-none"
              />
              <input
                value={newNomAuthor}
                onChange={(e) => setNewNomAuthor(e.target.value)}
                placeholder="Author"
                className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:border-[#B09B71]/50 focus:outline-none"
              />
            </div>
            <button
              onClick={addNomination}
              className="mt-3 w-full px-4 py-2 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-colors"
            >
              Nominate
            </button>
          </div>

          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Nominations — Vote for Next Month</h3>
          {nominations.sort((a, b) => b.votes.length - a.votes.length).map((nom) => {
            const hasVoted = nom.votes.includes(myLot);
            return (
              <div key={nom.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-heading)] text-sm">{nom.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">by {nom.author} · nominated by {nom.nominatedBy}</p>
                </div>
                <button
                  onClick={() => vote(nom.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    hasVoted ? 'bg-[#B09B71] text-[var(--surface-2)]' : 'border border-[rgba(245,240,232,0.10)] text-[var(--text-muted)] hover:border-[#B09B71]/30 hover:text-[#B09B71]'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {nom.votes.length}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'archive' && (
        <div className="space-y-3">
          {books.filter((b) => b.status === 'past').map((book) => (
            <div key={book.id} className="glass-card rounded-xl p-4 flex gap-4">
              <div className={`w-12 h-16 rounded-lg bg-gradient-to-b ${book.coverColor} border border-[rgba(245,240,232,0.10)] shrink-0 flex items-center justify-center`}>
                <BookOpen className="w-5 h-5 text-[rgba(245,240,232,0.50)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-heading)] text-sm">{book.title}</p>
                <p className="text-xs text-[var(--text-muted)]">by {book.author}</p>
                <p className="text-xs text-[var(--text-disabled)] mt-1">{book.month} {book.year} · {book.pages} pages</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
