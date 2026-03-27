'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMessages, Conversation } from '@/hooks/useMessages';
import { useDirectory } from '@/hooks/useDirectory';
import { useProperty } from '@/hooks/useProperty';
import { MessageBubble } from '@/components/MessageBubble';

// ── Opt-in registry helper ───────────────────────────────────────────────────
function setGlobalOptIn(address: string, value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const key = 'suvren_messaging_optins';
    const raw = localStorage.getItem(key);
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    map[address.toLowerCase()] = value;
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
}

// ── ConversationItem ─────────────────────────────────────────────────────────
function ConversationItem({
  convo,
  isActive,
  onClick,
}: {
  convo: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const lastText = convo.lastMessage?.text ?? 'No messages yet';
  const lastTime = convo.lastMessage
    ? new Date(convo.lastMessage.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-150 flex items-center gap-3 group ${
        isActive
          ? 'bg-[#c9a96e]/10 border border-[#c9a96e]/25'
          : 'hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#b8942e]/20 border border-[#c9a96e]/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-[#e8d5a3]">#{convo.lotId}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold text-gray-200 truncate">Lot #{convo.lotId}</span>
          <span className="text-[10px] text-gray-600 shrink-0 ml-2">{lastTime}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{lastText}</p>
      </div>

      {/* Unread badge */}
      {convo.unreadCount > 0 && (
        <div className="w-5 h-5 rounded-full bg-[#c9a96e] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-white">
            {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
          </span>
        </div>
      )}
    </button>
  );
}

// ── NewMessageModal ───────────────────────────────────────────────────────────
function NewMessageModal({
  onClose,
  onSelect,
  myLotId,
}: {
  onClose: () => void;
  onSelect: (lotId: string) => void;
  myLotId: string;
}) {
  const { optedInLots, loading } = useDirectory();
  const [search, setSearch] = useState('');

  const filtered = optedInLots.filter(
    (l) =>
      l.lotId !== myLotId &&
      (search === '' || l.lotId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-lg hover-lift w-full max-w-md p-6 border border-[#c9a96e]/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-100">New Message</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none p-1"
          >
            
          </button>
        </div>

        <input
          type="text"
          placeholder="Search lot number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-[#c9a96e]/50 mb-4"
          autoFocus
        />

        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading neighbors...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              {search
                ? 'No neighbors match your search.'
                : 'No neighbors have enabled messaging yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filtered.map((lot) => (
              <button
                key={lot.lotId}
                onClick={() => {
                  onSelect(lot.lotId);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#c9a96e]/10 border border-transparent hover:border-[#c9a96e]/20 transition-all duration-150 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#c9a96e]">#{lot.lotId}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">Lot #{lot.lotId}</p>
                  <p className="text-xs text-gray-600">{lot.ownerShort}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────
function ChatPanel({
  lotId,
  myLotId,
  onBack,
}: {
  lotId: string;
  myLotId: string;
  onBack: () => void;
}) {
  const { getMessages, sendMessage, markAsRead } = useMessages();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = getMessages(lotId);

  useEffect(() => {
    markAsRead(lotId);
  }, [lotId, markAsRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    sendMessage(lotId, text, myLotId);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700/50">
        <button
          onClick={onBack}
          className="md:hidden text-gray-400 hover:text-gray-200 mr-1 text-lg"
          aria-label="Back"
        >
          ←
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#b8942e]/20 border border-[#c9a96e]/20 flex items-center justify-center">
          <span className="text-xs font-bold text-[#e8d5a3]">#{lotId}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-200">Lot #{lotId}</p>
          <p className="text-xs text-gray-600">Neighbor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-4xl"></div>
            <p className="text-gray-400 text-sm font-medium">
              No messages yet — say hello to Lot #{lotId}!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} myLotId={myLotId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message Lot #${lotId}...`}
            className="flex-1 bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-[#c9a96e]/50 min-h-[44px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shrink-0"
            aria-label="Send message"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl mb-2"></div>
        <p className="text-gray-400 text-base font-medium">Sign in to use messaging</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return <MessagingCenter address={address!} />;
}

function MessagingCenter({ address }: { address: string }) {
  const { tokenId, hasProperty } = useProperty();
  const myLotId = tokenId?.toString() ?? '';

  const {
    isLoaded,
    optIn,
    conversations,
    totalUnread,
    setOptIn,
  } = useMessages();

  const [activeLotId, setActiveLotId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  function openConversation(lotId: string) {
    setActiveLotId(lotId);
    setMobileView('chat');
  }

  function handleOptInToggle(val: boolean) {
    setOptIn(val);
    setGlobalOptIn(address, val);
  }

  const activeConvo = activeLotId
    ? conversations.find((c) => c.lotId === activeLotId) ?? null
    : null;

  if (!hasProperty) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="text-5xl mb-4"></div>
        <h2 className="text-xl font-bold mb-2">No Property NFT Found</h2>
        <p className="text-gray-400 text-sm">You need a Faircroft Property NFT to use messaging.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">
            Messages
          </p>
          <h1 className="text-2xl font-normal tracking-tight flex items-center gap-2">
            Neighbor Messaging
            {totalUnread > 0 && (
              <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-[#c9a96e] text-white">
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        {/* Opt-in toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <span className="text-xs text-gray-500 font-semibold hidden sm:block">
            Allow neighbors to message me
          </span>
          <div
            onClick={() => handleOptInToggle(!optIn)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              optIn ? 'bg-[#c9a96e]' : 'bg-gray-700'
            }`}
            role="switch"
            aria-checked={optIn}
            tabIndex={0}
            onKeyDown={(e) => e.key === ' ' && handleOptInToggle(!optIn)}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                optIn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Opt-in info banner */}
      {!optIn && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300 font-medium">
           Messaging is opt-in. Enable the toggle above so neighbors can message you.
        </div>
      )}

      {/* Main Layout */}
      <div className="glass-card rounded-lg hover-lift overflow-hidden border border-gray-700/50" style={{ height: '70vh', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Sidebar — conversation list */}
          <div
            className={`${
              mobileView === 'chat' ? 'hidden' : 'flex'
            } md:flex flex-col w-full md:w-80 border-r border-gray-700/50 shrink-0`}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
              <span className="text-sm font-bold text-gray-300">Conversations</span>
              <button
                onClick={() => setShowNewModal(true)}
                className="text-xs font-semibold text-[#c9a96e] hover:text-[#e8d5a3] px-3 py-1.5 rounded-lg hover:bg-[#c9a96e]/10 transition-all duration-150 flex items-center gap-1"
              >
                <span></span> New
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-2">
              {!isLoaded ? (
                <div className="space-y-2 p-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4 py-8">
                  <div className="text-4xl"></div>
                  <p className="text-gray-500 text-sm font-medium">
                    No messages yet — reach out to a neighbor!
                  </p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="text-sm font-semibold text-[#c9a96e] hover:text-[#e8d5a3] px-4 py-2 rounded-xl hover:bg-[#c9a96e]/10 transition-all duration-150"
                  >
                    Start a conversation →
                  </button>
                </div>
              ) : (
                conversations.map((convo) => (
                  <ConversationItem
                    key={convo.lotId}
                    convo={convo}
                    isActive={convo.lotId === activeLotId}
                    onClick={() => openConversation(convo.lotId)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div
            className={`${
              mobileView === 'list' && !activeLotId ? 'hidden' : ''
            } ${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-col flex-1`}
          >
            {activeLotId && myLotId ? (
              <ChatPanel
                lotId={activeLotId}
                myLotId={myLotId}
                onBack={() => setMobileView('list')}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                <div className="text-5xl"></div>
                <p className="text-gray-400 text-base font-medium">
                  Select a conversation or start a new one
                </p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/30 hover:bg-[#c9a96e]/20 text-sm font-semibold text-[#e8d5a3] transition-all duration-200"
                >
                   New Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewModal && myLotId && (
        <NewMessageModal
          onClose={() => setShowNewModal(false)}
          onSelect={(lotId) => {
            openConversation(lotId);
            setShowNewModal(false);
          }}
          myLotId={myLotId}
        />
      )}
    </div>
  );
}
