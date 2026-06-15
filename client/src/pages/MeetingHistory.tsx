import { useMeetings } from '@/hooks/useMeetings';
import { Video, Clock, Users, FileText, Loader2, Calendar, Download } from 'lucide-react';

export default function MeetingHistory() {
  const { data: meetings, isLoading } = useMeetings();
  const completed = meetings?.filter((m) => m.status === 'completed') || [];

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Meeting History</h1>
          <p className="text-zinc-400">View past meetings, recordings, and summaries</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-300 border border-zinc-800 rounded-2xl">
            <Calendar className="w-12 h-12 text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-400">No completed meetings</h3>
            <p className="text-sm text-zinc-500">Your meeting history will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {completed.map((m) => (
              <div key={m._id} className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-200 mb-1">{m.title}</h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{m.description || 'No description'}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full shrink-0">
                        Completed
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(m.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {m.participants?.length || 0} participants</span>
                      {m.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.round(m.duration / 60)} min</span>}
                      {m.transcript?.length > 0 && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {m.transcript.length} transcript entries</span>}
                    </div>

                    {/* Recording */}
                    {m.recording && (
                      <a href={m.recording} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-primary-400 text-xs font-medium rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" /> View Recording
                      </a>
                    )}

                    {/* Summary */}
                    {m.summary && (
                      <div className="mt-4 p-4 bg-surface-200 rounded-xl">
                        <h4 className="text-xs font-semibold text-primary-400 mb-2">AI Summary</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">{m.summary}</p>
                      </div>
                    )}

                    {/* Action Items */}
                    {m.actionItems?.length > 0 && (
                      <div className="mt-3 p-4 bg-surface-200 rounded-xl">
                        <h4 className="text-xs font-semibold text-accent-400 mb-2">Action Items ({m.actionItems.length})</h4>
                        <div className="flex flex-col gap-2">
                          {m.actionItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
                              <span>{item.text} — <strong className="text-zinc-300">{item.assignee}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
