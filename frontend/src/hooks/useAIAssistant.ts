'use client';

import { useState, useCallback } from 'react';
import { useProperty } from './useProperty';
import { useTreasury, useDuesStatus } from './useTreasury';
import { useHealthScore } from './useHealthScore';
import { usePublicStats } from './usePublicData';

export type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
};

function nextQuarterDate(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const quarterStarts = [0, 3, 6, 9];
  const nextQ = quarterStarts.find((m) => m > month) ?? 0;
  const year = nextQ === 0 ? now.getFullYear() + 1 : now.getFullYear();
  const date = new Date(year, nextQ, 1);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function useAIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: "Good to see you. I'm the SuvrenHOA concierge — I can help with dues, treasury, proposals, health scores, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const property = useProperty();
  const treasury = useTreasury();
  const health = useHealthScore();
  const { activeProposals, totalProperties } = usePublicStats();
  const dues = useDuesStatus(property.tokenId);

  // FE-07: extract primitive/stable values before the useCallback dep array.
  // Hook objects (property, dues, treasury, health) are new references each render;
  // putting them directly in deps causes processQuery (and then sendMessage) to
  // recreate on every render, triggering infinite re-render loops in consumers.
  const hasProperty = property.hasProperty;
  const tokenId = property.tokenId;
  const totalSupply = property.totalSupply;
  const isDuesCurrent = dues.isCurrent;
  const quartersOwed = dues.quartersOwed;
  const amountOwed = dues.amountOwed;
  const totalBalance = treasury.totalBalance;
  const operatingBalance = treasury.operatingBalance;
  const reserveBalance = treasury.reserveBalance;
  const annualDiscount = treasury.annualDiscount;
  const quarterlyDues = treasury.quarterlyDues;
  const annualAmount = treasury.annualAmount;
  const healthLoading = health.loading;
  const healthScore = health.score;
  const healthGrade = health.grade;
  const healthFactors = health.factors;

  const processQuery = useCallback(
    async (text: string): Promise<string> => {
      const q = text.toLowerCase().trim();

      // ── Dues queries ────────────────────────────────────────
      if (/my dues|how much do i owe|dues status|am i current|paid up/.test(q)) {
        if (!hasProperty) {
          return "I don't see a property linked to your wallet. Connect a wallet that holds a SuvrenHOA property token to check your dues status.";
        }
        // V11 fix: emoji removed throughout — violates the "no emoji" design direction.
        if (isDuesCurrent === true) {
          return `You're all paid up. Your dues are current, and the next payment is due at the start of next quarter (${nextQuarterDate()}).`;
        }
        if (isDuesCurrent === false) {
          return `You have **${quartersOwed} quarter${quartersOwed !== 1 ? 's' : ''}** of dues outstanding — **$${amountOwed} USDC** total. Head to [Pay Dues](/dues) to get current.`;
        }
        return "Loading your dues status. One moment.";
      }

      // ── When are dues due ───────────────────────────────────
      if (/when.*dues|dues.*due|next.*quarter|quarter.*start/.test(q)) {
        return `Dues are collected **quarterly**. The next quarter starts **${nextQuarterDate()}**. Annual payment is also available at a ${annualDiscount}% discount — visit [/dues](/dues) to pay.`;
      }

      // ── How to pay dues ─────────────────────────────────────
      if (/how.*pay|pay.*dues|pay.*my|payment/.test(q)) {
        return `**To pay your dues:**\n\n1. Connect your wallet\n2. Go to [Dues](/dues)\n3. Choose quarterly ($${quarterlyDues} USDC) or annual ($${annualAmount} USDC — saves ${annualDiscount}%)\n4. Approve USDC and confirm the transaction`;
      }

      // ── Treasury ────────────────────────────────────────────
      if (/treasury|how much.*fund|fund.*balance|operating|reserve|budget/.test(q)) {
        return `**Treasury snapshot**\n\n• Total Balance — **$${totalBalance} USDC**\n• Operating Fund — $${operatingBalance} USDC\n• Reserve Fund — $${reserveBalance} USDC\n\nSee the full breakdown at [/treasury](/treasury).`;
      }

      // ── Properties / community size ─────────────────────────
      if (/how many.*prop|properties|community size|total.*home|home.*total|lots|units/.test(q)) {
        const count = totalSupply || Number(totalProperties) || 0;
        return `There are currently **${count} properties** registered in the SuvrenHOA community.`;
      }

      // ── Proposals ───────────────────────────────────────────
      if (/proposal|active.*vote|vote.*active|governance|pending.*proposal/.test(q)) {
        const count = Number(activeProposals) || 0;
        if (count === 0) {
          return `There are currently **no active proposals**. Visit [/proposals](/proposals) to see past proposals or create a new one.`;
        }
        return `There are **${count} active proposal${count !== 1 ? 's' : ''}** open for voting. Head to [/proposals](/proposals) to review and cast your vote.`;
      }

      // ── How to vote ─────────────────────────────────────────
      if (/how.*vote|voting.*process|cast.*vote|vote.*how/.test(q)) {
        return `**How to vote**\n\n1. Connect your wallet (must hold a property NFT)\n2. Go to [Proposals](/proposals)\n3. Select an active proposal\n4. Choose For, Against, or Abstain\n5. Confirm the transaction\n\nVoting power is one vote per property. Delegation is available.`;
      }

      // ── Health score ────────────────────────────────────────
      if (/health.*score|score|community.*health|hoa.*score/.test(q)) {
        if (healthLoading) {
          return "Calculating the community health score. One moment.";
        }
        const factorLines = healthFactors.map((f) => `• ${f.name} — ${f.score}/${f.max}`).join('\n');
        return `**Community Health Score — ${healthScore}/100 (Grade ${healthGrade})**\n\nKey factors:\n\n${factorLines}\n\nSee the full breakdown at [/health](/health).`;
      }

      // ── CC&Rs / Rules ───────────────────────────────────────
      if (/cc&r|ccr|rules|bylaws|covenant|regulation|restriction/.test(q)) {
        return `**CC&Rs** — the Covenants, Conditions & Restrictions — are the governing rules of your HOA. They cover architectural standards, pet policies, parking, and more.\n\nAll official documents are stored on-chain for transparency. Browse them at [/documents](/documents).`;
      }

      // ── Documents ───────────────────────────────────────────
      if (/document|docs|files|upload.*doc/.test(q)) {
        return `All HOA documents — CC&Rs, bylaws, meeting minutes — are stored on-chain. View them at [/documents](/documents).`;
      }

      // ── Contact board ───────────────────────────────────────
      if (/contact|board|who.*manage|reach out|email|phone|president|secretary|treasurer/.test(q)) {
        return `**Board contact**\n\n• President — board@suvren.hoa\n• General inquiries — contact@suvren.hoa\n• Emergency maintenance — use the [Maintenance portal](/maintenance)\n\nYou can also send a direct message via [/messages](/messages).`;
      }

      // ── Maintenance ─────────────────────────────────────────
      if (/maintenance|repair|fix|broken|submit.*request|request.*maintenance|issue/.test(q)) {
        return `**To submit a maintenance request:**\n\n1. Go to [Maintenance](/maintenance)\n2. Describe the issue\n3. Add photos if helpful\n4. Submit — the board will follow up\n\nYou can track the status of your requests there.`;
      }

      // ── Pool / amenities ────────────────────────────────────
      if (/pool.*hour|pool.*time|pool.*open|pool.*close/.test(q)) {
        return `**Pool hours**\n\n• Monday–Friday — 6 AM to 10 PM\n• Saturday–Sunday — 7 AM to 10 PM\n• Holidays — 8 AM to 8 PM\n\nReserve the pool for private events at [/reservations](/reservations).`;
      }

      if (/amenity|amenities|clubhouse|gym|fitness|tennis|facilities|rules.*amenity|amenity.*rules/.test(q)) {
        return `**Amenity guidelines**\n\n• Residents may bring up to three guests\n• No glass containers in the pool area\n• Quiet hours after 9 PM\n• Reservations required for private events\n\nBook at [/reservations](/reservations).`;
      }

      // ── Reservations ────────────────────────────────────────
      if (/reserv|book.*space|book.*room|clubhouse.*book/.test(q)) {
        return `Book community spaces — pool, clubhouse, and more — at [/reservations](/reservations). Reserve up to 90 days in advance.`;
      }

      // ── Directory ───────────────────────────────────────────
      if (/directory|neighbor|who.*live|resident.*list/.test(q)) {
        return `The resident directory is at [/directory](/directory). Connect your wallet to see your neighbors.`;
      }

      // ── Help / what can you do ──────────────────────────────
      if (/help|what can you|what do you know|commands|topics|about you|who are you/.test(q)) {
        return `I can answer questions about:\n\n• **Dues** — status, how to pay, deadlines\n• **Treasury** — balances and funds\n• **Proposals** — active votes and governance\n• **Health Score** — community metrics\n• **Documents** — CC&Rs and bylaws\n• **Maintenance** — how to submit requests\n• **Amenities** — pool hours and rules\n• **Contact** — how to reach the board\n\nAsk naturally.`;
      }

      // ── Fallback ────────────────────────────────────────────
      return `I don't have information on that yet. Try asking about:\n\n• Dues — "What are my dues?"\n• Treasury — "How much is in the treasury?"\n• Proposals — "Are there active proposals?"\n• Health score, amenities, or documents`;
    },
    // FE-07: stable primitives only — avoids recreating processQuery every render
    [
      hasProperty, tokenId, totalSupply,
      isDuesCurrent, quartersOwed, amountOwed,
      totalBalance, operatingBalance, reserveBalance, annualDiscount, quarterlyDues, annualAmount,
      healthLoading, healthScore, healthGrade, healthFactors,
      activeProposals, totalProperties,
    ]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      await new Promise((res) => setTimeout(res, 500 + Math.random() * 300));

      const response = await processQuery(text);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: response,
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    },
    [processQuery]
  );

  return { messages, sendMessage, isTyping };
}
