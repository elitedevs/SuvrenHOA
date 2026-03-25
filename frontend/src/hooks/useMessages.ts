'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface Message {
  id: string;
  from: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  lotId: string;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessageStore {
  conversations: Conversation[];
  optIn: boolean;
}

function getStoreKey(address: string): string {
  return `suvren_messages_${address.toLowerCase()}`;
}

function loadStore(address: string): MessageStore {
  if (typeof window === 'undefined') return { conversations: [], optIn: false };
  try {
    const raw = localStorage.getItem(getStoreKey(address));
    if (!raw) return { conversations: [], optIn: false };
    return JSON.parse(raw) as MessageStore;
  } catch {
    return { conversations: [], optIn: false };
  }
}

function saveStore(address: string, store: MessageStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStoreKey(address), JSON.stringify(store));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useMessages() {
  const { address, isConnected } = useAccount();
  const [store, setStore] = useState<MessageStore>({ conversations: [], optIn: false });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!address || !isConnected) {
      setStore({ conversations: [], optIn: false });
      setIsLoaded(false);
      return;
    }
    const s = loadStore(address);
    setStore(s);
    setIsLoaded(true);
  }, [address, isConnected]);

  const persist = useCallback(
    (next: MessageStore) => {
      if (!address) return;
      setStore(next);
      saveStore(address, next);
    },
    [address]
  );

  const getConversations = useCallback((): Conversation[] => {
    return [...store.conversations].sort((a, b) => {
      const aTime = a.lastMessage?.timestamp ?? 0;
      const bTime = b.lastMessage?.timestamp ?? 0;
      return bTime - aTime;
    });
  }, [store.conversations]);

  const getMessages = useCallback(
    (lotId: string): Message[] => {
      const convo = store.conversations.find((c) => c.lotId === lotId);
      return convo?.messages ?? [];
    },
    [store.conversations]
  );

  const sendMessage = useCallback(
    (toLotId: string, text: string, myLotId: string) => {
      if (!address || !text.trim()) return;
      const newMsg: Message = {
        id: generateId(),
        from: myLotId,
        text: text.trim(),
        timestamp: Date.now(),
        read: true,
      };
      const next = { ...store };
      const existing = next.conversations.find((c) => c.lotId === toLotId);
      if (existing) {
        existing.messages = [...existing.messages, newMsg];
        existing.lastMessage = newMsg;
        existing.unreadCount = existing.messages.filter(
          (m) => !m.read && m.from !== myLotId
        ).length;
      } else {
        next.conversations = [
          ...next.conversations,
          { lotId: toLotId, messages: [newMsg], lastMessage: newMsg, unreadCount: 0 },
        ];
      }
      persist(next);
    },
    [address, store, persist]
  );

  const receiveMessage = useCallback(
    (fromLotId: string, text: string) => {
      if (!address || !text.trim()) return;
      const newMsg: Message = {
        id: generateId(),
        from: fromLotId,
        text: text.trim(),
        timestamp: Date.now(),
        read: false,
      };
      const next = { ...store };
      const existing = next.conversations.find((c) => c.lotId === fromLotId);
      if (existing) {
        existing.messages = [...existing.messages, newMsg];
        existing.lastMessage = newMsg;
        existing.unreadCount = existing.messages.filter((m) => !m.read).length;
      } else {
        next.conversations = [
          ...next.conversations,
          { lotId: fromLotId, messages: [newMsg], lastMessage: newMsg, unreadCount: 1 },
        ];
      }
      persist(next);
    },
    [address, store, persist]
  );

  const markAsRead = useCallback(
    (lotId: string) => {
      const next = { ...store };
      const convo = next.conversations.find((c) => c.lotId === lotId);
      if (!convo) return;
      convo.messages = convo.messages.map((m) => ({ ...m, read: true }));
      convo.unreadCount = 0;
      persist(next);
    },
    [store, persist]
  );

  const setOptIn = useCallback(
    (value: boolean) => {
      const next = { ...store, optIn: value };
      persist(next);
    },
    [store, persist]
  );

  const totalUnread = store.conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    isLoaded,
    optIn: store.optIn,
    conversations: getConversations(),
    totalUnread,
    getConversations,
    getMessages,
    sendMessage,
    receiveMessage,
    markAsRead,
    setOptIn,
  };
}
