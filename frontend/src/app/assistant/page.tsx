'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAIAssistant } from '@/hooks/useAIAssistant';

const QUICK_ACTIONS = [
  { label: '💳 My Dues', query: 'What are my dues?' },
  { label: '💰 Treasury', query: 'How much is in the treasury?' },
  { label: '🗳️ Proposals', query: 'Are there active proposals?' },
  { label: '❤️ Health Score', query: "What's the community health score?" },
  { label: '📄 CC&Rs', query: 'What are the CC&Rs?' },
  { label: '🔧 Maintenance', query: 'How do I submit a maintenance request?' },
  { label: '🏊 Pool Hours', query: 'What are the pool hours?' },
  { label: '📬 Contact', query: 'How do I contact the board?' },
];

function MessageText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => {
        const tokens: React.ReactNode[] = [];
        const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
        let last = 0;
        let match;
        let key = 0;
        while ((match = regex.exec(line)) !== null) {
          if (match.index > last) tokens.push(<span key={key++}>{line.slice(last, match.index)}</span>);
          if (match[1]) {
            tokens.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
          } else if (match[2] && match[3]) {
            tokens.push(
              <Link key={key++} href={match[3]} className="underline text-[#c9a96e] hover:text-[#e8d5a3]">
                {match[2]}
              </Link>
            );
          }
          last = match.index + match[0].length;
        }
        if (last < line.length) tokens.push(<span key={key++}>{line.slice(last)}</span>);
        return <span key={li}>{tokens}{li < lines.length - 1 && <br />}</span>;
      })}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-9 h-9 rounded-full bg-[#c9a96e]/15 flex items-center justify-center text-lg shrink-0">🤖</div>
      <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-gray-400 inline-block animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isTyping } = useAIAssistant();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a]/80 to-[#2d2d2d]/80 border-b border-white/[0.06] px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a96e] to-[#b8942e] flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100">HOA Assistant</h1>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online — answers HOA questions using live on-chain data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'bot' && (
                <div className="w-9 h-9 rounded-full bg-[#c9a96e]/15 flex items-center justify-center text-lg shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#c9a96e] to-[#b8942e] text-white rounded-br-sm'
                    : 'bg-white/[0.06] text-gray-200 rounded-bl-sm'
                }`}
              >
                <MessageText text={msg.text} />
                <p className="text-[10px] opacity-40 mt-1">
                  {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-white/[0.04] px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] text-gray-500 mb-2">Quick questions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => sendMessage(a.query)}
                disabled={isTyping}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#c9a96e]/15 text-[#e8d5a3] hover:bg-[#c9a96e]/20 hover:text-[#e8d5a3] transition-colors disabled:opacity-40 border border-[#c9a96e]/20"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-4 pb-6 pt-3 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about dues, treasury, proposals, amenities..."
            disabled={isTyping}
            autoFocus
            className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9a96e] to-[#b8942e] hover:from-[#e8d5a3] hover:to-[#c9a96e] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-lg shadow-[#1a1a1a]/50"
            aria-label="Send message"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
