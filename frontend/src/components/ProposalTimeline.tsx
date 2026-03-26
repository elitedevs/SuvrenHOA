'use client';

interface ProposalTimelineProps {
  currentState: string; // 'Pending' | 'Active' | 'Succeeded' | 'Defeated' | 'Queued' | 'Executed' | 'Canceled' | 'Expired'
}

type Stage = {
  id: string;
  label: string;
  icon: string;
  activeStates: string[];
  doneStates: string[];
  failStates?: string[];
};

const STAGES: Stage[] = [
  {
    id: 'created',
    label: 'Created',
    icon: '',
    activeStates: ['Pending'],
    doneStates: ['Active', 'Succeeded', 'Defeated', 'Queued', 'Executed', 'Canceled', 'Expired'],
  },
  {
    id: 'voting',
    label: 'Voting',
    icon: '',
    activeStates: ['Active'],
    doneStates: ['Succeeded', 'Defeated', 'Queued', 'Executed'],
    failStates: ['Canceled'],
  },
  {
    id: 'result',
    label: 'Result',
    icon: '',
    activeStates: ['Succeeded', 'Defeated'],
    doneStates: ['Queued', 'Executed'],
    failStates: ['Defeated'],
  },
  {
    id: 'queued',
    label: 'Queued',
    icon: '⏱',
    activeStates: ['Queued'],
    doneStates: ['Executed'],
    failStates: ['Expired'],
  },
  {
    id: 'executed',
    label: 'Executed',
    icon: '',
    activeStates: ['Executed'],
    doneStates: [],
  },
];

type StageStatus = 'done' | 'active' | 'fail' | 'inactive';

function getStageStatus(stage: Stage, currentState: string): StageStatus {
  if (stage.activeStates.includes(currentState)) return 'active';
  if (stage.doneStates.includes(currentState)) return 'done';
  if (stage.failStates?.includes(currentState)) return 'fail';
  return 'inactive';
}

export function ProposalTimeline({ currentState }: ProposalTimelineProps) {
  const defeated = currentState === 'Defeated';
  const canceled = currentState === 'Canceled';
  const expired = currentState === 'Expired';
  const isFailed = defeated || canceled || expired;

  // For defeated/canceled proposals, show only up to result stage
  const visibleStages = isFailed
    ? STAGES.slice(0, defeated ? 3 : 2)
    : STAGES;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="text-base font-semibold mb-5">Proposal Lifecycle</h2>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-px bg-gray-800 z-0" />

        <div className="relative z-10 flex items-start justify-between gap-2">
          {visibleStages.map((stage, i) => {
            const status = getStageStatus(stage, currentState);
            const isActive = status === 'active';
            const isDone = status === 'done';
            const isFail = status === 'fail' ||
              (defeated && stage.id === 'result') ||
              (canceled && stage.id === 'voting') ||
              (expired && stage.id === 'queued');

            return (
              <div key={stage.id} className="flex flex-col items-center gap-2 flex-1">
                {/* Dot */}
                <div
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                    ${isActive
                      ? 'border-[#B09B71] bg-[#B09B71]/15 text-[#D4C4A0] shadow-[0_0_12px_rgba(201,169,110,0.4)] animate-pulse-gold'
                      : isDone
                      ? 'border-green-500/60 bg-[rgba(42,93,79,0.10)] text-[#3A7D6F]'
                      : isFail
                      ? 'border-red-500/50 bg-[rgba(107,58,58,0.10)] text-[#8B5A5A]'
                      : 'border-gray-700/60 bg-gray-800/40 text-[rgba(245,240,232,0.25)]'
                    }
                  `}
                >
                  {isDone ? '' : isFail && (defeated || canceled || expired) ? '' : stage.icon}
                </div>

                {/* Label */}
                <span
                  className={`text-[11px] font-medium text-center leading-tight
                    ${isActive ? 'text-[#D4C4A0]' : isDone ? 'text-[#3A7D6F]' : isFail ? 'text-[#8B5A5A]' : 'text-[rgba(245,240,232,0.25)]'}
                  `}
                >
                  {stage.id === 'result' && defeated ? 'Defeated' :
                   stage.id === 'result' && currentState === 'Succeeded' ? 'Succeeded' :
                   stage.id === 'voting' && canceled ? 'Canceled' :
                   stage.id === 'queued' && expired ? 'Expired' :
                   stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status description */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-[rgba(245,240,232,0.35)] text-center">
          {currentState === 'Pending' && '⏳ Waiting for voting to open (1-day delay)'}
          {currentState === 'Active' && ' Voting is open — cast your vote now'}
          {currentState === 'Succeeded' && ' Proposal passed! Waiting to be queued for execution'}
          {currentState === 'Defeated' && ' This proposal did not receive enough votes to pass'}
          {currentState === 'Queued' && '⏱ In timelock — will be executable after the delay period'}
          {currentState === 'Executed' && ' This proposal has been executed on-chain!'}
          {currentState === 'Canceled' && ' This proposal was canceled by the board'}
          {currentState === 'Expired' && '⏰ This proposal expired without execution'}
        </p>
      </div>
    </div>
  );
}
