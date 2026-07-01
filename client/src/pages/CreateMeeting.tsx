import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMeeting } from '@/hooks/useMeetings';
import { toast } from 'sonner';
import { Video, Calendar, Users, Settings, Loader2, KeyRound, ArrowRight, Sparkles } from 'lucide-react';
import API from '@/services/api';

export default function CreateMeeting() {
  const navigate = useNavigate();
  const createMeeting = useCreateMeeting();

  // Create meeting form state
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    date: '', 
    type: 'scheduled',
    participants: '',
    settings: { muteOnEntry: false, requireApproval: false, autoRecord: false },
  });

  // Join meeting state
  const [meetingCode, setMeetingCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) { toast.warning('Meeting title is required'); return; }
    try {
      const participants = formData.participants.split(',').map((p) => p.trim()).filter(Boolean);
      const result = await createMeeting.mutateAsync({ ...formData, participants } as any);
      toast.success('Meeting created successfully!');
      navigate(`/meeting/${result.meeting._id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create meeting');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = meetingCode.trim();
    if (!cleanCode) { toast.warning('Meeting code is required'); return; }
    
    setJoining(true);
    try {
      const res = await API.get(`/meetings/code/${cleanCode}`);
      const meeting = res.data;
      toast.success('Found meeting! Entering workspace...');
      navigate(`/meeting/${meeting._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Meeting not found. Check the code and try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="page-content">
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Meeting Hub</h1>
          <p className="text-zinc-400 text-sm font-medium">Join an ongoing conversation or provision a new meeting session</p>
        </div>

        {/* Action Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Join Meeting Card */}
          <div className="lg:col-span-2 bg-[linear-gradient(135deg,#111122_0%,#18182d_100%)] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center text-primary-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-150">Join via Code</h2>
                <p className="text-xs text-zinc-550 mt-0.5">Enter an 8-character meeting code</p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Meeting Code</label>
                <input 
                  type="text"
                  placeholder="e.g. 3a5b6c7d"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-full px-4 py-3.5 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-primary-500/50 transition-all font-mono font-bold tracking-widest text-center"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={joining}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg hover:shadow-primary-500/10"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                  </>
                ) : (
                  <>
                    Join Meeting <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-zinc-800/40 text-center">
              <span className="text-[11px] font-semibold text-zinc-600 flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent-500" /> AI transcript & summarizes enabled</span>
            </div>
          </div>

          {/* Create Meeting Card */}
          <div className="lg:col-span-3 bg-surface-300 border border-zinc-800 rounded-2xl p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/40">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-150">Create New Meeting</h2>
                <p className="text-xs text-zinc-550 mt-0.5">Schedule a workspace session for collaborative notes</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Meeting Title</label>
                <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Weekly scrum / sprint sync"
                  className="w-full px-4 py-3.5 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-primary-500/50 transition-all font-semibold" required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Write topics to discuss or objectives..."
                  rows={3} className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-primary-500/50 resize-none transition-all font-medium" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-4.5 h-4.5 text-zinc-550" /> Date & Time</label>
                  <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all font-semibold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Meeting Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-250 focus:outline-none focus:border-primary-500/50 transition-all font-bold">
                    <option value="scheduled">Scheduled</option>
                    <option value="instant">Instant</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-4.5 h-4.5 text-zinc-550" /> Invite Participants</label>
                <input value={formData.participants} onChange={(e) => setFormData({ ...formData, participants: e.target.value })} placeholder="John Doe, Alice Smith, Bob Johnson"
                  className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-primary-500/50 transition-all font-medium" />
                <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Comma-separated full names</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Settings className="w-4.5 h-4.5 text-zinc-550" /> Room Settings</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'muteOnEntry', label: 'Mute on entry' },
                    { key: 'requireApproval', label: 'Require approval' },
                    { key: 'autoRecord', label: 'Auto-record' },
                  ].map((s) => (
                    <label key={s.key} className="flex items-center gap-2.5 cursor-pointer bg-surface-400 border border-zinc-800 p-3 rounded-xl hover:border-zinc-700 transition-colors">
                      <input type="checkbox" checked={formData.settings[s.key as keyof typeof formData.settings]}
                        onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, [s.key]: e.target.checked } })}
                        className="w-4.5 h-4.5 accent-primary-500 rounded border-zinc-800" />
                      <span className="text-xs font-bold text-zinc-400">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={createMeeting.isPending}
                className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg">
                {createMeeting.isPending ? <><Loader2 className="w-4.5 h-4.5 animate-spin" /> Provisioning Room...</> : 'Create & Launch Meeting'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
