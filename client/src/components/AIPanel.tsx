import { useState, useEffect, useRef } from 'react';
import API from '@/services/api';
import { FileText, Sparkles, CheckCircle2, Mic, Users, Clock, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranscriptEntry, ActionItem } from '@/types';

interface AIPanelProps {
  meetingId?: string;
  transcript: TranscriptEntry[];
  onActionItemsUpdate?: (items: ActionItem[]) => void;
}

interface Summary {
  overview: string;
  keyPoints: string[];
  participants: string[];
  estimatedDuration: string;
  totalEntries: number;
  generatedAt: string;
}

export default function AIPanel({ meetingId, transcript, onActionItemsUpdate }: AIPanelProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'actions'>('transcript');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const generateSummary = async () => {
    if (!transcript || transcript.length === 0) return;
    setLoadingSummary(true);
    try {
      const res = await API.post('/ai/summarize', { meetingId, transcript });
      setSummary(res.data.summary);
      setActiveTab('summary');
    } catch { /* silent */ } finally { setLoadingSummary(false); }
  };

  const extractActions = async () => {
    if (!transcript || transcript.length === 0) return;
    setLoadingActions(true);
    try {
      const res = await API.post('/ai/action-items', { meetingId, transcript });
      setActionItems(res.data.actionItems || []);
      onActionItemsUpdate?.(res.data.actionItems);
      setActiveTab('actions');
    } catch { /* silent */ } finally { setLoadingActions(false); }
  };

  const exportSummary = () => {
    if (!summary) return;
    const content = [
      '# Meeting Summary',
      `Generated: ${new Date(summary.generatedAt).toLocaleString()}`,
      `Participants: ${summary.participants?.join(', ') || 'N/A'}`,
      `Duration: ${summary.estimatedDuration || 'N/A'}`,
      '', '## Overview', summary.overview, '',
      '## Key Points', ...(summary.keyPoints || []).map((p, i) => `${i + 1}. ${p}`), '',
      '## Action Items', ...actionItems.map((item, i) => `${i + 1}. ${item.text} (${item.assignee})`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${meetingId?.slice(0, 8) || 'export'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'transcript' as const, label: 'Transcript', icon: FileText },
    { id: 'summary' as const, label: 'Summary', icon: Sparkles },
    { id: 'actions' as const, label: 'Actions', icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-2 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all',
              activeTab === tab.id
                ? 'text-primary-400 border-primary-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-400'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'transcript' && (
          <div>
            {transcript && transcript.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3 px-3 py-2 bg-surface-200 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {transcript.length} entries recorded
                </div>
                <div className="flex flex-col gap-3">
                  {transcript.map((entry, i) => (
                    <div key={i} className="p-3 bg-surface-200 rounded-xl border-l-[3px] border-primary-500">
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-bold text-primary-400">{entry.speaker}</span>
                        <span className="text-[10px] text-zinc-600 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed m-0">{entry.text}</p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Mic className="w-8 h-8 text-zinc-700" />
                <h4 className="text-sm text-zinc-400">No transcript yet</h4>
                <p className="text-xs text-zinc-600 max-w-[240px]">Enable transcription in video controls to start recording speech.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            {summary ? (
              <>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 p-3 bg-surface-200 rounded-xl mb-4">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {summary.participants?.join(', ') || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {summary.estimatedDuration || 'N/A'}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {summary.totalEntries} entries</span>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-primary-400 mb-2">Overview</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">{summary.overview}</p>
                </div>
                {summary.keyPoints?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-primary-400 mb-2">Key Points</h4>
                    <div className="flex flex-col gap-2">
                      {summary.keyPoints.map((point, i) => (
                        <div key={i} className="text-sm text-zinc-400 p-2 px-3 bg-surface-200 rounded-lg border-l-2 border-accent-500 leading-relaxed">
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Sparkles className="w-8 h-8 text-zinc-700" />
                <h4 className="text-sm text-zinc-400">No summary yet</h4>
                <p className="text-xs text-zinc-600 max-w-[240px]">Record a transcript first, then click Generate Summary.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div>
            {actionItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {actionItems.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-surface-200 rounded-xl overflow-hidden">
                    <div className={cn(
                      'w-[3px] rounded-full shrink-0',
                      item.status === 'completed' ? 'bg-emerald-500' : item.status === 'in-progress' ? 'bg-amber-500' : 'bg-red-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 mb-2 leading-relaxed">{item.text}</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] px-2 py-0.5 bg-surface-300 text-zinc-400 rounded-full">{item.assignee}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-surface-300 text-zinc-400 rounded-full">{item.status}</span>
                        {item.dueDate && (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-zinc-700" />
                <h4 className="text-sm text-zinc-400">No action items yet</h4>
                <p className="text-xs text-zinc-600 max-w-[240px]">Record a transcript first, then click Extract Actions.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex gap-2 p-3 border-t border-zinc-800 bg-surface-500 shrink-0 flex-wrap">
        <button
          onClick={generateSummary}
          disabled={loadingSummary || !transcript?.length}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-medium rounded-lg transition-colors"
        >
          {loadingSummary ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</> : 'Generate Summary'}
        </button>
        <button
          onClick={extractActions}
          disabled={loadingActions || !transcript?.length}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-200 hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 text-[11px] font-medium rounded-lg transition-colors border border-zinc-700"
        >
          {loadingActions ? <><Loader2 className="w-3 h-3 animate-spin" /> Extracting...</> : 'Extract Actions'}
        </button>
        {summary && (
          <button
            onClick={exportSummary}
            className="flex items-center gap-1.5 px-3 py-2 text-zinc-400 hover:text-zinc-200 text-[11px] font-medium transition-colors"
          >
            <Download className="w-3 h-3" /> Export
          </button>
        )}
      </div>
    </div>
  );
}
