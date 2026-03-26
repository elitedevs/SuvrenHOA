'use client';

import { useReadContract } from 'wagmi';
import { useContracts } from './useContracts';

export interface OnChainDocument {
  contentHash: string;
  timestamp: number;
  supersedes: number;
  docType: number;
  uploadedBy: string;
  arweaveTxId: string;
  ipfsCid: string;
  title: string;
}

const DOC_TYPE_LABELS: Record<number, string> = {
  0: 'CC&Rs',
  1: 'Minutes',
  2: 'Budget',
  3: 'Amendment',
  4: 'Resolution',
  5: 'Financial',
  6: 'Architectural',
  7: 'Notice',
  8: 'Election',
  9: 'Other',
};

const DOC_TYPE_COLORS: Record<number, string> = {
  0: 'amber',
  1: 'blue',
  2: 'green',
  3: 'orange',
  4: 'cyan',
  5: 'emerald',
  6: 'amber',
  7: 'yellow',
  8: 'pink',
  9: 'gray',
};

const DOC_TYPE_ICONS: Record<number, string> = {
  0: '📜', 1: '📝', 2: '📊', 3: '✏️', 4: '⚖️',
  5: '💰', 6: '🏗️', 7: '📢', 8: '🗳️', 9: '📄',
};

export function useDocuments() {
  const { documentRegistry } = useContracts();

  const { data: count } = useReadContract({
    ...documentRegistry,
    functionName: 'getDocumentCount',
  });

  const documentCount = count ? Number(count) : 0;

  return {
    documentCount,
    getTypeLabel: (type: number) => DOC_TYPE_LABELS[type] || 'Other',
    getTypeColor: (type: number) => DOC_TYPE_COLORS[type] || 'gray',
    getTypeIcon: (type: number) => DOC_TYPE_ICONS[type] || '📄',
  };
}

export function useDocument(docId: number) {
  const { documentRegistry } = useContracts();

  const { data, isLoading } = useReadContract({
    ...documentRegistry,
    functionName: 'getDocument',
    args: [BigInt(docId ?? 0)],
    query: { enabled: docId >= 0 },
  });

  let parsed: OnChainDocument | undefined;
  try {
    if (data && Array.isArray(data) && data.length >= 8) {
      const doc = data as [string, bigint, bigint, number, string, string, string, string];
      parsed = {
        contentHash: doc[0] ?? '',
        timestamp: Number(doc[1] ?? 0),
        supersedes: Number(doc[2] ?? 0),
        docType: Number(doc[3] ?? 0),
        uploadedBy: doc[4] ?? '0x0',
        arweaveTxId: doc[5] ?? '',
        ipfsCid: doc[6] ?? '',
        title: doc[7] ?? 'Untitled',
      };
    }
  } catch {
    parsed = undefined;
  }

  return {
    isLoading,
    document: parsed,
  };
}

export function useVerifyDocument() {
  const { documentRegistry } = useContracts();

  return {
    contractAddress: documentRegistry.address,
    abi: documentRegistry.abi,
  };
}

export { DOC_TYPE_LABELS, DOC_TYPE_COLORS, DOC_TYPE_ICONS };
