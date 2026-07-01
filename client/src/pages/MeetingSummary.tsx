import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeeting } from '@/hooks/useMeetings';
import { useCreateTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useTeams } from '@/hooks/useTeams';
import { toast } from 'sonner';
import { 
  ChevronLeft, Video, Clock, Users, FileText, Sparkles, 
  CheckCircle2, Download, Loader2, Play, Search, PlusCircle, 
  Calendar, Check, ShieldAlert, ArrowRight, UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import API from '@/services/api';

export default function MeetingSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: meeting, isLoading, refetch } = useMeeting(id);
  const { data: users } = useUsers();
  const { data: teams } = useTeams();
  const createTask = useCreateTask();

  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'transcript'>('summary');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  
  // Task conversion state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<any | null>(null);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignee: '',
    team: '',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-600">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="page-content text-center py-20 bg-surface-600">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-300">Meeting Not Found</h2>
        <button onClick={() => navigate('/meetings')} className="mt-4 px-4 py-2 bg-primary-500 rounded-lg text-sm text-white">Back to Meetings</button>
      </div>
    );
  }

  // Export summary to Markdown file
  const handleExport = () => {
    const content = [
      `# Meeting Summary: ${meeting.title}`,
      `Date: ${new Date(meeting.date).toLocaleDateString()}`,
      `Estimated Duration: ${meeting.duration ? `${Math.round(meeting.duration / 60)} minutes` : 'N/A'}`,
      `Participants: ${meeting.participants?.join(', ') || 'N/A'}`,
      '',
      '## AI Overview',
      meeting.summary || 'No summary generated yet.',
      '',
      '## Key Action Items',
      ...(meeting.actionItems || []).map((item: any, i: number) => `${i + 1}. [${item.status}] ${item.text} (Assignee: ${item.assignee})`),
      '',
      '## Transcript Highlights',
      ...(meeting.transcript || []).map((t: any) => `[${t.speaker}]: ${t.text}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${meeting.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Summary exported to Markdown!');
  };

  // Open task conversion modal pre-filled
  const openTaskModal = (actionItem: any) => {
    setSelectedActionItem(actionItem);
    // Find matched user for pre-select assignee
    const matchedUser = users?.find(u => u.name.toLowerCase().includes(actionItem.assignee?.toLowerCase()));
    
    // Map dates
    let formattedDate = '';
    if (actionItem.dueDate) {
      formattedDate = new Date(actionItem.dueDate).toISOString().split('T')[0];
    }

    setTaskData({
      title: actionItem.text,
      description: `Created from action item of meeting: "${meeting.title}"`,
      priority: actionItem.priority || 'medium',
      dueDate: formattedDate,
      assignee: matchedUser?.id || '',
      team: '',
    });
    setShowTaskModal(true);
  };

  const handleCreateTaskFromAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: taskData.dueDate || undefined,
        assignee: taskData.assignee || undefined,
        status: 'todo',
        meeting: meeting._id,
      };

      if (taskData.team) {
        data.team = taskData.team;
      }

      await createTask.mutateAsync(data);
      toast.success('Task created successfully on the Project Board!');

      // Update the action item status inside the meeting
      if (meeting.actionItems) {
        const updatedActions = meeting.actionItems.map((item: any) => {
          if (item.text === selectedActionItem.text) {
            return { ...item, status: 'in-progress' };
          }
          return item;
        });

        await API.put(`/meetings/${meeting._id}`, { actionItems: updatedActions });
        refetch();
      }

      setShowTaskModal(false);
    } catch {
      toast.error('Failed to convert action item to task');
    }
  };

  // Speakers list for filtering transcripts
  const speakers = ['all', ...new Set(meeting.transcript?.map((t: any) => t.speaker).filter(Boolean))];

  // Filtered transcripts
  const filteredTranscript = meeting.transcript?.filter((t: any) => {
    const matchesSearch = t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase());
    const matchesSpeaker = selectedSpeaker === 'all' || t.speaker === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  }) || [];

  const tabItems = [
    { id: 'summary' as const, label: 'AI Summary', icon: Sparkles },
    { id: 'actions' as const, label: 'Action Items', icon: CheckCircle2 },
    { id: 'transcript' as const, label: 'Full Transcript', icon: FileText },
  ];

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        {/* Navigation / Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/meeting-history')} className="w-9 h-9 rounded-xl bg-surface-300 hover:bg-surface-200 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-500">Back to History</span>
        </div>

        {/* Dashboard Title */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">{meeting.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2 font-medium">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary-400" /> {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {meeting.duration ? `${Math.round(meeting.duration / 60)} minutes` : 'Completed'}</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-accent-400" /> {meeting.participants?.length || 0} Participants</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-300 hover:bg-surface-200 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-semibold transition-all">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recording Player card */}
            {meeting.recording ? (
              <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-4 shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Play className="w-4.5 h-4.5 text-primary-400" />
                  <h3 className="text-sm font-bold text-zinc-200">Meeting Recording</h3>
                </div>
                <video src={meeting.recording} controls className="w-full rounded-xl border border-zinc-800 bg-black aspect-video max-h-[380px] object-contain" />
              </div>
            ) : (
              <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 py-12">
                <Video className="w-10 h-10 text-zinc-700 mb-2" />
                <h4 className="text-sm font-bold text-zinc-400">No Recording Uploaded</h4>
                <p className="text-xs text-zinc-650 max-w-[280px]">Meeting video recording was not saved or uploaded for this session.</p>
              </div>
            )}

            {/* AI Summary Tabs */}
            <div className="bg-surface-300 border border-zinc-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
              {/* Tab Switchers */}
              <div className="flex border-b border-zinc-850 bg-surface-500/50">
                {tabItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold border-b-2 transition-all',
                      activeTab === tab.id
                        ? 'text-primary-400 border-primary-500 bg-surface-300/40'
                        : 'text-zinc-500 border-transparent hover:text-zinc-400 hover:bg-surface-300/10'
                    )}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              <div className="p-6 min-h-[300px]">
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-primary-400 mb-2 uppercase tracking-wider">AI Executive Summary</h4>
                      <p className="text-sm text-zinc-300 leading-relaxed font-medium bg-surface-200 p-4 rounded-xl border border-zinc-800/40">
                        {meeting.summary || "No summary generated. Head to the meeting room AI tab to create one."}
                      </p>
                    </div>

                    {/* Key discussion points */}
                    {meeting.transcript && meeting.transcript.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-accent-400 mb-3 uppercase tracking-wider">Discussion Key Notes</h4>
                        <div className="space-y-2">
                          {(meeting.transcript.slice(0, 5)).map((entry: any, i: number) => (
                            <div key={i} className="flex gap-3 items-start p-3 bg-surface-200 border-l-[3px] border-accent-500 rounded-lg">
                              <span className="text-[11px] font-bold text-accent-400 whitespace-nowrap">{entry.speaker}:</span>
                              <p className="text-xs text-zinc-400 m-0 leading-relaxed font-medium">{entry.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'actions' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary-400 mb-2 uppercase tracking-wider">Meeting Action Plan</h4>
                    {!meeting.actionItems || meeting.actionItems.length === 0 ? (
                      <p className="text-sm text-zinc-500 py-6 text-center">No action items extracted for this meeting.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {meeting.actionItems.map((item: any, i: number) => (
                          <div key={i} className="bg-surface-200 border border-zinc-850 p-4 rounded-xl flex flex-wrap justify-between items-start gap-4 hover:border-zinc-700 transition-all">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-200 leading-snug mb-2">{item.text}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded-full font-bold bg-surface-300 text-zinc-400 flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5 text-zinc-500" /> {item.assignee}</span>
                                {item.dueDate && (
                                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10 flex items-center gap-1">
                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border',
                                  item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                                )}>
                                  {item.status || 'pending'}
                                </span>
                              </div>
                            </div>
                            {item.status !== 'completed' && (
                              <button onClick={() => openTaskModal(item)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary-500/15 hover:bg-primary-500 text-primary-400 hover:text-white border border-primary-500/20 rounded-lg text-xs font-bold transition-all shadow-md">
                                <PlusCircle className="w-3.5 h-3.5" /> Convert to Task
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'transcript' && (
                  <div className="space-y-4">
                    {/* Transcript filters */}
                    <div className="flex flex-wrap gap-3 items-center mb-4">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search transcript dialog..."
                          value={transcriptSearch}
                          onChange={(e) => setTranscriptSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all font-semibold"
                        />
                      </div>
                      <select
                        value={selectedSpeaker}
                        onChange={(e) => setSelectedSpeaker(e.target.value)}
                        className="px-3 py-2 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-primary-500/50 transition-all font-semibold"
                      >
                        <option value="all">All Speakers</option>
                        {speakers.filter(s => s !== 'all').map((speaker) => (
                          <option key={speaker} value={speaker}>{speaker}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dialog transcript feed */}
                    {!meeting.transcript || meeting.transcript.length === 0 ? (
                      <p className="text-sm text-zinc-550 text-center py-8">No transcript entries recorded.</p>
                    ) : filteredTranscript.length === 0 ? (
                      <p className="text-sm text-zinc-550 text-center py-8">No matching entries found.</p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {filteredTranscript.map((entry: any, i: number) => (
                          <div key={i} className="p-3 bg-surface-200 border border-zinc-800/40 rounded-xl transition-all hover:bg-surface-300/20">
                            <div className="flex justify-between items-center gap-4 mb-1">
                              <span className="text-[11px] font-bold text-primary-400 uppercase tracking-wider">{entry.speaker}</span>
                              <span className="text-[10px] text-zinc-600 font-mono">
                                {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-medium m-0">{entry.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Metadata & Side Info */}
          <div className="space-y-6">
            {/* Participants list */}
            <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-zinc-200 mb-4 uppercase tracking-wider">Attendance ({meeting.participants?.length || 0})</h3>
              <div className="space-y-3">
                {(!meeting.participants || meeting.participants.length === 0) ? (
                  <p className="text-xs text-zinc-500 py-2">No recorded participants.</p>
                ) : (
                  meeting.participants.map((participant: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-200 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {participant.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{participant}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Action items checklist preview */}
            <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-zinc-200 mb-4 uppercase tracking-wider">Overview Checklist</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-xs text-zinc-400 bg-surface-200 p-3 rounded-lg border border-zinc-800/40">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Transcript Captured: {meeting.transcript?.length || 0} entries</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 bg-surface-200 p-3 rounded-lg border border-zinc-800/40">
                  <Check className={cn('w-4 h-4', meeting.recording ? 'text-emerald-500' : 'text-zinc-650')} />
                  <span>Meeting Video Recording {meeting.recording ? 'Available' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 bg-surface-200 p-3 rounded-lg border border-zinc-800/40">
                  <Check className={cn('w-4 h-4', meeting.summary ? 'text-emerald-500' : 'text-zinc-650')} />
                  <span>AI summary {meeting.summary ? 'Generated' : 'Not generated'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 max-w-md w-full animate-scale-in shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <h3 className="text-sm font-bold text-zinc-200">Convert Action Item to Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
            </div>
            
            <form onSubmit={handleCreateTaskFromAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Title</label>
                <input 
                  value={taskData.title} 
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })} 
                  className="w-full px-4 py-2.5 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all font-semibold"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Workspace (Workspace/Team)</label>
                  <select 
                    value={taskData.team} 
                    onChange={(e) => setTaskData({ ...taskData, team: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="">Personal Workspace</option>
                    {teams?.map(t => (
                      <option key={t._id} value={t._id}>{t.name} Workspace</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Assignee</label>
                  <select 
                    value={taskData.assignee} 
                    onChange={(e) => setTaskData({ ...taskData, assignee: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users?.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Priority</label>
                  <select 
                    value={taskData.priority} 
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    value={taskData.dueDate} 
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea 
                  value={taskData.description} 
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })} 
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface-400 border border-zinc-800 rounded-xl text-xs text-zinc-250 resize-none"
                />
              </div>

              <button type="submit" disabled={createTask.isPending}
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                {createTask.isPending ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null} Sync to Project Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
