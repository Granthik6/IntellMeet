import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMeeting } from '@/hooks/useMeetings';
import { toast } from 'sonner';
import { Video, Calendar, Users, Settings, Loader2 } from 'lucide-react';

export default function CreateMeeting() {
  const navigate = useNavigate();
  const createMeeting = useCreateMeeting();

  const [formData, setFormData] = useState({
    title: '', description: '', date: '', type: 'scheduled',
    participants: '',
    settings: { muteOnEntry: false, requireApproval: false, autoRecord: false },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) { toast.warning('Meeting title is required'); return; }
    try {
      const participants = formData.participants.split(',').map((p) => p.trim()).filter(Boolean);
      const result = await createMeeting.mutateAsync({ ...formData, participants } as never);
      toast.success('Meeting created!');
      navigate(`/meeting/${result.meeting._id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create meeting');
    }
  };

  return (
    <div className="page-content">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Create Meeting</h1>
          <p className="text-zinc-400">Set up a new meeting for your team</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-300 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Video className="w-4 h-4 text-primary-400" /> Meeting Title</label>
            <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Weekly standup"
              className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Meeting agenda..."
              rows={3} className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 resize-none transition-all" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-400" /> Date & Time</label>
              <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Meeting Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all">
                <option value="scheduled">Scheduled</option>
                <option value="instant">Instant</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Users className="w-4 h-4 text-primary-400" /> Participants</label>
            <input value={formData.participants} onChange={(e) => setFormData({ ...formData, participants: e.target.value })} placeholder="user1, user2, user3"
              className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all" />
            <p className="text-xs text-zinc-600">Comma-separated names</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Settings className="w-4 h-4 text-primary-400" /> Settings</label>
            {[
              { key: 'muteOnEntry', label: 'Mute on entry' },
              { key: 'requireApproval', label: 'Require approval to join' },
              { key: 'autoRecord', label: 'Auto-record meeting' },
            ].map((s) => (
              <label key={s.key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.settings[s.key as keyof typeof formData.settings]}
                  onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, [s.key]: e.target.checked } })}
                  className="w-4 h-4 accent-primary-500 rounded" />
                <span className="text-sm text-zinc-400">{s.label}</span>
              </label>
            ))}
          </div>

          <button type="submit" disabled={createMeeting.isPending}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {createMeeting.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Meeting'}
          </button>
        </form>
      </div>
    </div>
  );
}
