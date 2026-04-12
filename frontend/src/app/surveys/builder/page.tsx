'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

type QuestionType = 'text' | 'multiple_choice' | 'rating';

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[]; // for multiple_choice
  scale?: number; // for rating, default 5
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  status: 'draft' | 'published';
  createdAt: string;
  publishedAt?: string;
  responses: SurveyResponse[];
}

interface SurveyResponse {
  id: string;
  submittedAt: string;
  wallet: string;
  answers: Record<string, string | number>;
}

const STORAGE_KEY = 'faircroft_survey_builder_v1';

const SAMPLE_SURVEYS: Survey[] = [
  {
    id: 'sb-001',
    title: 'Community Amenity Satisfaction',
    description: 'Help us improve our shared spaces by rating your experience.',
    status: 'published',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    questions: [
      { id: 'q1', type: 'rating', label: 'How satisfied are you with the pool maintenance?', required: true, scale: 5 },
      { id: 'q2', type: 'multiple_choice', label: 'Which amenity do you use most?', required: true, options: ['Pool', 'Gym', 'Clubhouse', 'Tennis Court', 'Playground'] },
      { id: 'q3', type: 'text', label: 'Any suggestions for improvement?', required: false },
    ],
    responses: [
      { id: 'r1', submittedAt: new Date(Date.now() - 8 * 86400000).toISOString(), wallet: '0xabc', answers: { q1: 4, q2: 'Pool', q3: 'More sun loungers please!' } },
      { id: 'r2', submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(), wallet: '0xdef', answers: { q1: 5, q2: 'Gym', q3: '' } },
      { id: 'r3', submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(), wallet: '0xghi', answers: { q1: 3, q2: 'Pool', q3: 'Better lighting at night' } },
    ],
  },
];

export default function SurveyBuilderPage() {
  const { isConnected, address } = useAccount();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [view, setView] = useState<'list' | 'build' | 'preview' | 'results'>('list');
  const [current, setCurrent] = useState<Survey | null>(null);
  const [activeResults, setActiveResults] = useState<Survey | null>(null);
  const [draftForm, setDraftForm] = useState({ title: '', description: '' });
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setSurveys(raw ? JSON.parse(raw) : SAMPLE_SURVEYS);
  }, []);

  const save = (next: Survey[]) => {
    setSurveys(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const createDraft = () => {
    const s: Survey = {
      id: `sb-${Date.now()}`,
      title: draftForm.title,
      description: draftForm.description,
      questions: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      responses: [],
    };
    setQuestions([]);
    setCurrent(s);
    setView('build');
  };

  const addQuestion = (type: QuestionType) => {
    const q: Question = {
      id: `q-${Date.now()}`,
      type,
      label: '',
      required: false,
      options: type === 'multiple_choice' ? ['', ''] : undefined,
      scale: type === 'rating' ? 5 : undefined,
    };
    setQuestions([...questions, q]);
  };

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const saveDraft = () => {
    if (!current) return;
    const updated = { ...current, questions };
    const exists = surveys.find(s => s.id === updated.id);
    const next = exists ? surveys.map(s => s.id === updated.id ? updated : s) : [updated, ...surveys];
    save(next);
    setCurrent(updated);
  };

  const publish = () => {
    if (!current) return;
    const updated = { ...current, questions, status: 'published' as const, publishedAt: new Date().toISOString() };
    const next = surveys.map(s => s.id === updated.id ? updated : s);
    if (!surveys.find(s => s.id === updated.id)) next.unshift(updated);
    save(next);
    setCurrent(null);
    setQuestions([]);
    setView('list');
  };

  const submitResponse = (surveyId: string, answers: Record<string, string | number>) => {
    if (!address) return;
    save(surveys.map(s => {
      if (s.id !== surveyId) return s;
      const resp: SurveyResponse = { id: `r-${Date.now()}`, submittedAt: new Date().toISOString(), wallet: address, answers };
      return { ...s, responses: [...s.responses, resp] };
    }));
  };

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-[var(--text-muted)] mb-4">Sign in to access the Survey Builder</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/surveys" className="text-[var(--text-disabled)] hover:text-[var(--text-body)] text-sm transition-colors">Surveys</Link>
            <span className="text-[var(--text-disabled)]">/</span>
            <span className="text-sm text-[var(--text-body)]">Builder</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Survey Builder</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create rich multi-question surveys for the community</p>
        </div>
        {view === 'list' && (
          <button onClick={() => setView('build')}
            className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shrink-0">
            + New Survey
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="space-y-4">
          {surveys.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <ClipboardList className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No surveys yet. Create your first one!</p>
            </div>
          ) : surveys.map(s => (
            <div key={s.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                      s.status === 'published' ? 'bg-[rgba(42,93,79,0.10)] text-[#2A5D4F] border-[rgba(42,93,79,0.20)]' : 'bg-[rgba(245,240,232,0.04)] text-[var(--text-muted)] border-[rgba(245,240,232,0.08)]'
                    }`}>
                      {s.status === 'published' ? ' Published' : ' Draft'}
                    </span>
                    <span className="text-[10px] text-[var(--text-disabled)]">{s.questions.length} questions · {s.responses.length} responses</span>
                  </div>
                  <h3 className="font-medium">{s.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{s.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {s.status === 'published' && (
                    <button onClick={() => { setActiveResults(s); setView('results'); }}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[rgba(176,155,113,0.30)] text-[#B09B71] hover:bg-[rgba(176,155,113,0.10)] transition-colors">
                      Results
                    </button>
                  )}
                  {s.status === 'draft' && (
                    <button onClick={() => { setCurrent(s); setQuestions(s.questions); setView('build'); }}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[rgba(245,240,232,0.08)] text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.04)] transition-colors">
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'build' && (
        <div className="space-y-5">
          {!current && (
            <div className="glass-card rounded-xl p-5 space-y-4">
              <h2 className="text-base font-medium">Survey Details</h2>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Title</label>
                <input value={draftForm.title} onChange={e => setDraftForm({...draftForm, title: e.target.value})}
                  placeholder="Survey title..." className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
                <textarea value={draftForm.description} onChange={e => setDraftForm({...draftForm, description: e.target.value})}
                  placeholder="Brief explanation for respondents..." rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
              </div>
              <button onClick={createDraft} disabled={!draftForm.title}
                className="px-4 py-2 rounded-xl bg-[#B09B71] text-[var(--surface-2)] text-sm font-medium disabled:opacity-50 transition-all">
                Continue →
              </button>
            </div>
          )}

          {/* Questions */}
          {current && (
            <div className="glass-card rounded-xl p-5">
              <h2 className="text-base font-medium mb-1">{current.title}</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">{current.description}</p>
              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div key={q.id} className="p-4 rounded-xl bg-[rgba(26,26,30,0.30)] border border-[rgba(245,240,232,0.08)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-disabled)] font-medium">
                        Q{qi + 1} · {q.type === 'text' ? 'Text' : q.type === 'multiple_choice' ? 'Multiple Choice' : 'Rating'}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[10px] text-[var(--text-disabled)] cursor-pointer">
                          <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} className="w-3 h-3" />
                          Required
                        </label>
                        <button onClick={() => removeQuestion(q.id)} className="text-[var(--text-disabled)] hover:text-[#8B5A5A] text-sm transition-colors"></button>
                      </div>
                    </div>
                    <input value={q.label} onChange={e => updateQuestion(q.id, { label: e.target.value })}
                      placeholder="Question text..." className="w-full px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex gap-2">
                            <input value={opt} onChange={e => {
                              const opts = [...q.options!]; opts[oi] = e.target.value;
                              updateQuestion(q.id, { options: opts });
                            }} placeholder={`Option ${oi + 1}`}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
                            {q.options!.length > 2 && (
                              <button onClick={() => updateQuestion(q.id, { options: q.options!.filter((_, i) => i !== oi) })} className="text-[var(--text-disabled)] hover:text-[#8B5A5A] text-xs"></button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => updateQuestion(q.id, { options: [...q.options!, ''] })} className="text-xs text-[#B09B71] hover:underline">+ Add option</button>
                      </div>
                    )}
                    {q.type === 'rating' && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-muted)]">Scale:</span>
                        {[3, 5, 10].map(n => (
                          <button key={n} onClick={() => updateQuestion(q.id, { scale: n })}
                            className={`px-2 py-1 rounded text-xs ${q.scale === n ? 'bg-[rgba(176,155,113,0.20)] text-[#B09B71]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'}`}>
                            1–{n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add question */}
              <div className="flex gap-2 mt-4">
                <button onClick={() => addQuestion('text')} className="flex-1 py-2 rounded-xl border border-dashed border-[rgba(245,240,232,0.08)] text-xs text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[#B09B71] transition-colors"> Text</button>
                <button onClick={() => addQuestion('multiple_choice')} className="flex-1 py-2 rounded-xl border border-dashed border-[rgba(245,240,232,0.08)] text-xs text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[#B09B71] transition-colors"> Multiple Choice</button>
                <button onClick={() => addQuestion('rating')} className="flex-1 py-2 rounded-xl border border-dashed border-[rgba(245,240,232,0.08)] text-xs text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[#B09B71] transition-colors"> Rating</button>
              </div>
            </div>
          )}

          {current && (
            <div className="flex gap-3">
              <button onClick={() => { setView('list'); setCurrent(null); setQuestions([]); }} className="py-3 px-5 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
              <button onClick={saveDraft} disabled={questions.length === 0} className="py-3 px-5 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] disabled:opacity-50 transition-colors">Save Draft</button>
              <button onClick={() => setView('preview')} disabled={questions.length === 0}
                className="py-3 px-5 rounded-xl border border-[rgba(176,155,113,0.30)] text-[#B09B71] text-sm font-medium hover:bg-[rgba(176,155,113,0.10)] disabled:opacity-50 transition-colors">
                Preview
              </button>
              <button onClick={publish} disabled={questions.length === 0}
                className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
                Publish to Community
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'preview' && current && (
        <SurveyPreview
          survey={{ ...current, questions }}
          onBack={() => setView('build')}
          onSubmit={(answers) => { submitResponse(current.id, answers); setView('list'); }}
          address={address}
        />
      )}

      {view === 'results' && activeResults && (
        <SurveyResults survey={activeResults} onBack={() => { setView('list'); setActiveResults(null); }} />
      )}
    </div>
  );
}

function SurveyPreview({ survey, onBack, onSubmit, address }: { survey: Survey; onBack: () => void; onSubmit: (a: Record<string, string | number>) => void; address?: string }) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const alreadyResponded = address ? survey.responses.some(r => r.wallet === address) : false;

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[rgba(90,122,154,0.10)] text-[var(--steel)] border border-[rgba(90,122,154,0.20)]"> Preview Mode</span>
        </div>
        <h2 className="text-lg font-medium mb-1">{survey.title}</h2>
        <p className="text-sm text-[var(--text-muted)]">{survey.description}</p>
      </div>

      {survey.questions.map((q, qi) => (
        <div key={q.id} className="glass-card rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium">
            {qi + 1}. {q.label}
            {q.required && <span className="text-[#8B5A5A] ml-1">*</span>}
          </p>
          {q.type === 'text' && (
            <textarea value={String(answers[q.id] || '')} onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
              placeholder="Your answer..." rows={3} className="w-full px-3 py-2 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
          )}
          {q.type === 'multiple_choice' && q.options && (
            <div className="space-y-2">
              {q.options.filter(o => o.trim()).map(opt => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                    onChange={() => setAnswers({...answers, [q.id]: opt})} className="accent-[#B09B71]" />
                  <span className="text-sm text-[var(--text-body)]">{opt}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === 'rating' && (
            <div className="flex gap-2">
              {Array.from({ length: q.scale || 5 }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setAnswers({...answers, [q.id]: n})}
                  className={`w-10 h-10 rounded-xl text-sm font-medium border transition-all ${
                    answers[q.id] === n ? 'bg-[rgba(176,155,113,0.20)] text-[#B09B71] border-[rgba(176,155,113,0.40)]' : 'glass-card text-[var(--text-disabled)] border-[rgba(245,240,232,0.08)]'
                  }`}>{n}</button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={onBack} className="py-3 px-5 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">← Back to Builder</button>
        {!alreadyResponded && (
          <button onClick={() => onSubmit(answers)}
            className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all">
            Submit Response
          </button>
        )}
      </div>
    </div>
  );
}

function SurveyResults({ survey, onBack }: { survey: Survey; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">{survey.title} — Results</h2>
          <span className="text-sm text-[var(--text-muted)]">{survey.responses.length} response{survey.responses.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {survey.questions.map((q, qi) => {
        const answers = survey.responses.map(r => r.answers[q.id]).filter(Boolean);
        return (
          <div key={q.id} className="glass-card rounded-xl p-5">
            <p className="text-sm font-medium mb-4">{qi + 1}. {q.label}</p>
            {q.type === 'rating' && (() => {
              const nums = answers.map(Number);
              const avg = nums.length > 0 ? nums.reduce((a,b) => a+b, 0) / nums.length : 0;
              const scale = q.scale || 5;
              const dist: Record<number, number> = {};
              nums.forEach(n => { dist[n] = (dist[n] || 0) + 1; });
              return (
                <div>
                  <p className="text-2xl font-medium text-[#B09B71] mb-4">{avg.toFixed(1)} <span className="text-sm text-[var(--text-muted)]">/ {scale} avg</span></p>
                  <div className="space-y-2">
                    {Array.from({ length: scale }, (_, i) => i + 1).map(n => {
                      const cnt = dist[n] || 0;
                      const pct = answers.length > 0 ? (cnt / answers.length) * 100 : 0;
                      return (
                        <div key={n} className="flex items-center gap-3">
                          <span className="text-xs text-[var(--text-muted)] w-4">{n}</span>
                          <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)]">
                            <div className="h-2 rounded-full bg-[#B09B71] transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-[var(--text-disabled)] w-6">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {q.type === 'multiple_choice' && q.options && (() => {
              const counts: Record<string, number> = {};
              (answers as string[]).forEach(a => { counts[a] = (counts[a] || 0) + 1; });
              const max = Math.max(...Object.values(counts), 1);
              return (
                <div className="space-y-2">
                  {q.options.filter(o => o.trim()).map(opt => {
                    const cnt = counts[opt] || 0;
                    const pct = answers.length > 0 ? (cnt / answers.length) * 100 : 0;
                    return (
                      <div key={opt}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-body)]">{opt}</span>
                          <span className="text-[var(--text-disabled)]">{cnt} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--surface-2)]">
                          <div className="h-2 rounded-full bg-[#B09B71] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {q.type === 'text' && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(answers as string[]).filter(a => a.trim()).map((a, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.30)] text-sm text-[var(--text-body)] italic">"{a}"</div>
                ))}
                {answers.filter((a: any) => a.trim()).length === 0 && <p className="text-xs text-[var(--text-disabled)]">No text responses yet</p>}
              </div>
            )}
          </div>
        );
      })}

      <button onClick={onBack} className="py-3 px-5 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">← Back</button>
    </div>
  );
}
