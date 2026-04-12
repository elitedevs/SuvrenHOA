'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMessages, Conversation } from '@/hooks/useMessages';
import { useDirectory } from '@/hooks/useDirectory';
import { useProperty } from '@/hooks/useProperty';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageSquare, Home } from 'lucide-react';

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
          ? 'bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)]'
          : 'hover:bg-[rgba(245,240,232,0.04)] border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(176,155,113,0.20)] to-[var(--brass-deep)]/20 border border-[rgba(176,155,113,0.20)] flex items-center justify-center shrink-0">
        <span className="text-xs font-medium text-[#D4C4A0]">#{convo.lotId}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-medium text-[var(--parchment)] truncate">Lot #{convo.lotId}</span>
          <span className="text-[10px] text-[var(--text-disabled)] shrink-0 ml-2">{lastTime}</span>
        </div>
        <p className="text-xs text-[var(--text-disabled)] truncate">{lastText}</p>
      </div>

      {/* Unread badge */}
      {convo.unreadCount > 0 && (
        <div className="w-5 h-5 rounded-full bg-[#B09B71] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-[var(--text-heading)]">
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
      <div className="glass-card rounded-xl hover-lift w-full max-w-md p-6 border border-[rgba(176,155,113,0.20)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--parchment)]">New Message</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-disabled)] hover:text-[var(--text-body)] text-xl leading-none p-1"
          >
            
          </button>
        </div>

        <input
          type="text"
          placeholder="Search lot number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-2.5 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] outline-none focus:border-[rgba(176,155,113,0.50)] mb-4"
          autoFocus
        />

        {loading ? (
          <div className="text-center py-8 text-[var(--text-disabled)] text-sm">Loading neighbors...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-disabled)] text-sm">
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
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[rgba(176,155,113,0.10)] border border-transparent hover:border-[rgba(176,155,113,0.20)] transition-all duration-150 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)] flex items-center justify-center">
                  <span className="text-xs font-medium text-[#B09B71]">#{lot.lotId}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--parchment)]">Lot #{lot.lotId}</p>
                  <p className="text-xs text-[var(--text-disabled)]">{lot.ownerShort}</p>
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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(245,240,232,0.08)]">
        <button
          onClick={onBack}
          className="md:hidden text-[var(--text-muted)] hover:text-[var(--parchment)] mr-1 text-lg"
          aria-label="Back"
        >
          ←
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[rgba(176,155,113,0.20)] to-[var(--brass-deep)]/20 border border-[rgba(176,155,113,0.20)] flex items-center justify-center">
          <span className="text-xs font-medium text-[#D4C4A0]">#{lotId}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--parchment)]">Lot #{lotId}</p>
          <p className="text-xs text-[var(--text-disabled)]">Neighbor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <MessageSquare className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
            <p className="text-[var(--text-muted)] text-sm font-medium">
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
      <div className="px-4 py-3 border-t border-[rgba(245,240,232,0.08)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message Lot #${lotId}...`}
            className="flex-1 bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-2.5 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] outline-none focus:border-[rgba(176,155,113,0.50)] min-h-[44px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shrink-0"
            aria-label="Send message"
          >
            <svg className="w-4 h-4 text-[var(--text-heading)]" fill="currentColor" viewBox="0 0 20 20">
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
    return <AuthWall title="Messages" description="Direct messages with your neighbors and community management." />;
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
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <Home className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2">No Property NFT Found</h2>
        <p className="text-[var(--text-muted)] text-sm">You need a Faircroft Property NFT to use messaging.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">
            Messages
          </p>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text flex items-center gap-2">
            Neighbor Messaging
            {totalUnread > 0 && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-lg bg-[#B09B71] text-[var(--text-heading)]">
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        {/* Opt-in toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <span className="text-xs text-[var(--text-disabled)] font-medium hidden sm:block">
            Allow neighbors to message me
          </span>
          <div
            onClick={() => handleOptInToggle(!optIn)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              optIn ? 'bg-[#B09B71]' : 'bg-[var(--surface-3)]'
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
        <div className="mb-4 px-4 py-3 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)] text-sm text-[#B09B71] font-medium">
           Messaging is opt-in. Enable the toggle above so neighbors can message you.
        </div>
      )}

      {/* Main Layout */}
      <div className="glass-card rounded-xl hover-lift overflow-hidden border border-[rgba(245,240,232,0.08)]" style={{ height: '70vh', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Sidebar — conversation list */}
          <div
            className={`${
              mobileView === 'chat' ? 'hidden' : 'flex'
            } md:flex flex-col w-full md:w-80 border-r border-[rgba(245,240,232,0.08)] shrink-0`}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(245,240,232,0.08)]">
              <span className="text-sm font-medium text-[var(--text-body)]">Conversations</span>
              <button
                onClick={() => setShowNewModal(true)}
                className="text-xs font-medium text-[#B09B71] hover:text-[#D4C4A0] px-3 py-1.5 rounded-lg hover:bg-[rgba(176,155,113,0.10)] transition-all duration-150 flex items-center gap-1"
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
                  <p className="text-[var(--text-disabled)] text-sm font-medium">
                    No messages yet — reach out to a neighbor!
                  </p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="text-sm font-medium text-[#B09B71] hover:text-[#D4C4A0] px-4 py-2 rounded-xl hover:bg-[rgba(176,155,113,0.10)] transition-all duration-150"
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
                <MessageSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <p className="text-[var(--text-muted)] text-base font-medium">
                  Select a conversation or start a new one
                </p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.30)] hover:bg-[rgba(176,155,113,0.20)] text-sm font-medium text-[#D4C4A0] transition-all duration-200"
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
