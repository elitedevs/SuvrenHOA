'use client';

import { Message } from '@/hooks/useMessages';

interface MessageBubbleProps {
  message: Message;
  myLotId: string;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, myLotId }: MessageBubbleProps) {
  const isSent = message.from === myLotId;

  return (
    <div className={`flex flex-col gap-1 mb-3 ${isSent ? 'items-end' : 'items-start'}`}>
      {/* Sender label */}
      <span className="text-[11px] font-medium text-[var(--text-disabled)] px-1">
        {isSent ? 'You' : `Lot #${message.from}`}
      </span>

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
          isSent
            ? 'bg-[#B09B71] text-[var(--text-heading)] rounded-br-sm shadow-[0_2px_12px_rgba(201,169,110,0.25)]'
            : 'bg-[rgba(34,34,40,0.80)] text-[var(--parchment)] rounded-bl-sm border border-[rgba(245,240,232,0.08)]'
        }`}
      >
        {message.text}
      </div>

      {/* Timestamp + read status */}
      <div className={`flex items-center gap-1.5 px-1 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-[10px] text-[var(--text-disabled)]">{formatTime(message.timestamp)}</span>
        {isSent && (
          <span className={`text-[10px] ${message.read ? 'text-[#B09B71]' : 'text-[var(--text-disabled)]'}`}>
            {message.read ? '' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
