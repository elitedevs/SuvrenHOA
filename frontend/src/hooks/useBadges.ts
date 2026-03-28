'use client';

import { useMemo } from 'react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon?: string;
  earned: boolean;
}

interface BadgeInput {
  tokenId?: number | null;        // has a mint (early adopter check uses tokenId <= 10)
  duesCurrents?: boolean;         // all dues paid
  voteCount?: number;             // proposals voted on
  messageCount?: number;          // community messages sent
  documentCount?: number;         // documents uploaded
}

export function useBadges(input: BadgeInput): Badge[] {
  return useMemo(() => {
    const { tokenId, duesCurrents, voteCount = 0, messageCount = 0, documentCount = 0 } = input;
    return [
      {
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'One of the first 10 residents to mint',
        earned: !!tokenId && tokenId <= 10,
      },
      {
        id: 'perfect_payer',
        name: 'Perfect Payer',
        description: 'All dues are current',
        earned: !!duesCurrents,
      },
      {
        id: 'active_voter',
        name: 'Active Voter',
        description: 'Voted on 3 or more governance proposals',
        earned: voteCount >= 3,
      },
      {
        id: 'community_builder',
        name: 'Community Builder',
        description: 'Sent 5 or more community messages',
        earned: messageCount >= 5,
      },
      {
        id: 'document_keeper',
        name: 'Document Keeper',
        description: 'Uploaded at least one community document',
        earned: documentCount >= 1,
      },
    ];
  }, [input.tokenId, input.duesCurrents, input.voteCount, input.messageCount, input.documentCount]);
}
