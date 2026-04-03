'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAIAssistant } from '@/hooks/useAIAssistant';

const QUICK_ACTIONS = [
  { label: 'My Dues', query: 'What are my dues?' },
  { label: 'Treasury', query: 'How much is in the treasury?' },
  { label: 'Proposals', query: 'Are there active proposals?' },
  { label: 'Health Score', query: "What's the community health score?" },
];

/** Simple markdown-like renderer: **bold**, [link](url), \n newlines */
function MessageText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        // Parse inline tokens: **bold** and [label](url)
        const tokens: React.ReactNode[] = [];
        const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
        let last = 0;
        let match;
        let key = 0;
        while ((match = regex.exec(line)) !== null) {
          if (match.index > last) {
            tokens.push(<span key={key++}>{line.slice(last, match.index)}</span>);
          }
          if (match[1]) {
            tokens.push(<strong key={key++} className="font-medium">{match[1]}</strong>);
          } else if (match[2] && match[3]) {
            tokens.push(
              <Link key={key++} href={match[3]} className="underline text-[#B09B71] hover:text-[#D4C4A0]">
                {match[2]}
              </Link>
            );
          }
          last = match.index + match[0].length;
        }
        if (last < line.length) tokens.push(<span key={key++}>{line.slice(last)}</span>);
        return (
          <span key={li}>
            {tokens}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-[rgba(176,155,113,0.15)] flex items-center justify-center text-sm shrink-0">
        
      </div>
      <div className="bg-[rgba(245,240,232,0.06)] rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] inline-block animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isTyping } = useAIAssistant();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-4 z-50 w-[min(400px,calc(100vw-2rem))] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        role="dialog"
        aria-label="AI Community Assistant"
        aria-hidden={!isOpen}
      >
        <div className="bg-[#111113] border border-[rgba(245,240,232,0.08)] rounded-xl rounded-br-lg shadow-2xl flex flex-col overflow-hidden" style={{ height: '500px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[rgba(26,26,30,0.80)] to-[rgba(34,34,40,0.80)] border-b border-[rgba(245,240,232,0.06)] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl"></span>
              <div>
                <p className="text-sm font-medium text-[var(--parchment)]">HOA Assistant</p>
                <p className="text-[11px] text-[#3A7D6F] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3A7D6F] inline-block" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/assistant"
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--parchment)] transition-colors px-2 py-1 rounded-lg hover:bg-[rgba(245,240,232,0.06)]"
                title="Open full page"
              >
                ↗ Full page
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[rgba(245,240,232,0.10)] text-[var(--text-muted)] hover:text-[var(--parchment)] transition-colors"
                aria-label="Close assistant"
              >
                
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[rgba(176,155,113,0.15)] flex items-center justify-center text-sm shrink-0">
                    
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#B09B71] to-[var(--brass-deep)] text-[var(--text-heading)] rounded-br-sm'
                      : 'bg-[rgba(245,240,232,0.06)] text-[var(--parchment)] rounded-bl-sm'
                  }`}
                >
                  <MessageText text={msg.text} />
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-3 pb-2 pt-1 flex gap-1.5 flex-wrap shrink-0 border-t border-[rgba(245,240,232,0.04)]">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => sendMessage(a.query)}
                disabled={isTyping}
                className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-[rgba(176,155,113,0.15)] text-[#D4C4A0] hover:bg-[rgba(176,155,113,0.20)] hover:text-[#D4C4A0] transition-colors disabled:opacity-40 border border-[rgba(176,155,113,0.20)]"
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about dues, treasury, proposals..."
              disabled={isTyping}
              className="flex-1 bg-[rgba(245,240,232,0.06)] border border-[rgba(245,240,232,0.08)] rounded-xl px-3 py-2 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.25)] focus:outline-none focus:ring-1 focus:ring-[rgba(176,155,113,0.50)] disabled:opacity-50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="Send message"
            >
              <svg className="w-4 h-4 text-[var(--text-heading)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#B09B71] to-[var(--brass-deep)] shadow-lg shadow-[rgba(26,26,30,0.50)] flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-[rgba(176,155,113,0.20)] ${
          isOpen ? 'rotate-180' : ''
        }`}
        style={!isOpen ? { animation: 'chatPulse 2.5s ease-in-out infinite' } : undefined}
        aria-label={isOpen ? 'Close assistant' : 'Open HOA assistant'}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-[var(--text-heading)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-[var(--text-heading)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      <style jsx global>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 10px 25px rgba(184,148,46,0.35), 0 0 0 0 rgba(201,169,110,0.3); }
          50% { box-shadow: 0 10px 25px rgba(184,148,46,0.35), 0 0 0 8px rgba(201,169,110,0); }
        }
      `}</style>
    </>
  );
}
