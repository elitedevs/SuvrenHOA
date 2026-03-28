'use client';

interface Template {
  id: string;
  icon?: string;
  name: string;
  category: number;  // 0=Routine, 1=Financial, 2=Governance, 3=Constitutional
  categoryLabel: string;
  titleTemplate: string;
  descriptionTemplate: string;
  suggestedVotingDays: number;
  suggestedQuorum: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'budget_amendment',
    name: 'Budget Amendment',
    category: 1,
    categoryLabel: 'Financial',
    titleTemplate: 'Budget Amendment: [Item/Category] for FY[Year]',
    descriptionTemplate: `## Summary
[Brief description of the budget change]

## Background
[Why this change is needed]

## Proposed Change
- Current budget line: $[amount]
- Proposed change: $[amount]
- Net impact: $[difference]

## Justification
[Why this expenditure is necessary and reasonable]

## Funding Source
[Where the funds will come from]`,
    suggestedVotingDays: 7,
    suggestedQuorum: '33%',
  },
  {
    id: 'rule_change',
    name: 'Rule Change',
    category: 2,
    categoryLabel: 'Governance',
    titleTemplate: 'Rule Change: [CC&R / HOA Rules Section] — [Brief Description]',
    descriptionTemplate: `## Summary
[One-sentence summary of the rule change]

## Current Rule
[Quote the existing rule text, or state "No existing rule"]

## Proposed Rule
[Full text of the new or amended rule]

## Rationale
[Why this change improves the community]

## Impact Assessment
- Residents affected: [all / specific group]
- Implementation timeline: [immediate / 30 days / etc]
- Enforcement mechanism: [how will this be enforced]`,
    suggestedVotingDays: 14,
    suggestedQuorum: '51%',
  },
  {
    id: 'capital_improvement',
    name: 'Capital Improvement',
    category: 1,
    categoryLabel: 'Financial',
    titleTemplate: 'Capital Improvement: [Project Name]',
    descriptionTemplate: `## Project Description
[Describe the improvement project]

## Location
[Where the improvement will be made]

## Cost Estimate
- Materials: $[amount]
- Labor: $[amount]
- Contingency (10%): $[amount]
- **Total: $[amount]**

## Funding
[Reserve fund / special assessment / combination]

## Timeline
- Bidding: [date range]
- Approval needed by: [date]
- Target completion: [date]

## Vendor Selection
[How vendors will be selected]`,
    suggestedVotingDays: 14,
    suggestedQuorum: '33%',
  },
  {
    id: 'emergency_resolution',
    name: 'Emergency Resolution',
    category: 0,
    categoryLabel: 'Routine',
    titleTemplate: 'Emergency Resolution: [Issue Description]',
    descriptionTemplate: `## Emergency Description
[Describe the emergency or time-sensitive situation]

## Urgency
[Why this cannot wait for the regular voting cycle]

## Proposed Action
[Specific action(s) the board is authorized to take]

## Cost Authorization
Up to $[amount] from [fund source]

## Reporting
The board will report all expenditures to residents within [X] days of action.`,
    suggestedVotingDays: 3,
    suggestedQuorum: '15%',
  },
  {
    id: 'board_election',
    name: 'Board Election',
    category: 2,
    categoryLabel: 'Governance',
    titleTemplate: 'Board Election: [Position] — [Term Period]',
    descriptionTemplate: `## Position
[Board role: President / Vice President / Treasurer / Secretary / Member-at-Large]

## Term
[e.g., 2-year term, beginning [date]]

## Candidates
[List nominees and their lot numbers — or state "Open for nominations"]

## Eligibility Requirements
- Must hold a valid Property NFT
- Must be in good standing (dues current)
- No active violations

## Voting
- Each property NFT = 1 vote
- Winner = most votes (plurality)
- Ties resolved by coin flip at board meeting`,
    suggestedVotingDays: 7,
    suggestedQuorum: '51%',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Routine: 'green',
  Financial: 'blue',
  Governance: 'amber',
  Constitutional: 'red',
};

interface Props {
  onUseTemplate: (template: { title: string; description: string; category: number }) => void;
}

export function ProposalTemplates({ onUseTemplate }: Props) {
  return (
    <div className="glass-card rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl"></span>
        <div>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Quick Start</p>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Create from Template</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map(t => {
          const color = CATEGORY_COLORS[t.categoryLabel] || 'gray';
          return (
            <button
              key={t.id}
              onClick={() => onUseTemplate({
                title: t.titleTemplate,
                description: t.descriptionTemplate,
                category: t.category,
              })}
              className="text-left rounded-md p-4 border border-gray-700/50 bg-gray-800/30 hover:border-[#c9a96e]/30 hover:bg-[#c9a96e]/5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[#e8d5a3] transition-colors">{t.name}</p>
                  <p className={`text-[10px] mt-0.5 text-${color}-400`}>{t.categoryLabel}</p>
                  <p className="text-[10px] text-gray-500 mt-1">~{t.suggestedVotingDays}d voting · {t.suggestedQuorum} quorum</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-600 mt-4">
        Templates pre-fill the proposal form with structured sections. You can edit everything before submitting.
      </p>
    </div>
  );
}
