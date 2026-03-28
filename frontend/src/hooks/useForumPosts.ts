'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ForumReply {
  id: string;
  topicId: string;
  author: string;
  lotNumber?: number;
  content: string;
  createdAt: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  author: string;
  lotNumber?: number;
  category: string;
  content: string;
  createdAt: string;
  replies: ForumReply[];
  pinned?: boolean;
}

const STORAGE_KEY = 'forum_topics_v1';

function load(): ForumTopic[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultTopics();
  } catch {
    return getDefaultTopics();
  }
}

function save(topics: ForumTopic[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
}

function getDefaultTopics(): ForumTopic[] {
  return [
    {
      id: 'default-1',
      title: 'Welcome to the Faircroft Community Forum!',
      author: 'Board Admin',
      lotNumber: 1,
      category: 'Announcements',
      content: 'Welcome to our community discussion board! This is a space for residents to discuss community matters, ask questions, and connect with neighbors. Please keep discussions respectful and constructive.',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      pinned: true,
      replies: [
        {
          id: 'reply-1',
          topicId: 'default-1',
          author: 'Lot #3 Resident',
          lotNumber: 3,
          content: 'Great to have this! Looking forward to connecting with neighbors.',
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: 'default-2',
      title: 'Pool maintenance schedule — feedback needed',
      author: 'Lot #7 Resident',
      lotNumber: 7,
      category: 'Amenities',
      content: 'The board is reviewing pool maintenance schedules. Would prefer earlier morning cleanings (6-7am) so the pool is available all day. Anyone else have thoughts?',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      pinned: false,
      replies: [],
    },
  ];
}

export function useForumPosts() {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTopics(load());
    setIsLoaded(true);
  }, []);

  const createTopic = useCallback((data: {
    title: string;
    content: string;
    category: string;
    author: string;
    lotNumber?: number;
  }) => {
    const newTopic: ForumTopic = {
      id: `topic-${Date.now()}`,
      title: data.title,
      content: data.content,
      category: data.category,
      author: data.author,
      lotNumber: data.lotNumber,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setTopics(prev => {
      const updated = [newTopic, ...prev];
      save(updated);
      return updated;
    });
    return newTopic.id;
  }, []);

  const addReply = useCallback((topicId: string, data: {
    content: string;
    author: string;
    lotNumber?: number;
  }) => {
    const reply: ForumReply = {
      id: `reply-${Date.now()}`,
      topicId,
      content: data.content,
      author: data.author,
      lotNumber: data.lotNumber,
      createdAt: new Date().toISOString(),
    };
    setTopics(prev => {
      const updated = prev.map(t =>
        t.id === topicId ? { ...t, replies: [...t.replies, reply] } : t
      );
      save(updated);
      return updated;
    });
  }, []);

  return { topics, isLoaded, createTopic, addReply };
}
