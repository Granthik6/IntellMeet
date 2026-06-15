import { useNavigate } from 'react-router-dom';
import { useMeetings, useDeleteMeeting } from '@/hooks/useMeetings';
import { toast } from 'sonner';
import { Video, PlusCircle, Clock, Users, Trash2, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Meetings() {
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();

  const handleDelete = async (id: string) => {
    try { await deleteMeeting.mutateAsync(id); toast.success('Meeting deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-primary-500/20 text-primary-400',
    active: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-zinc-500/20 text-zinc-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Meetings</h1>
            <p className="text-zinc-400">All your scheduled and past meetings</p>
          </div>
          <button onClick={() => navigate('/create-meeting')}
            className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all">
            <PlusCircle className="w-5 h-5" /> New Meeting
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : !meetings?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-300 border border-zinc-800 rounded-2xl">
            <Calendar className="w-12 h-12 text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-400">No meetings yet</h3>
            <button onClick={() => navigate('/create-meeting')}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
              Create your first meeting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((m) => (
              <div key={m._id}
                className="bg-surface-300 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all group cursor-pointer"
                onClick={() => navigate(`/meeting/${m._id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                    <Video className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusColors[m.status] || statusColors.scheduled)}>
                    {m.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-200 mb-2 truncate">{m.title}</h3>
                <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{m.description || 'No description'}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(m.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {m.participants?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(m._id); }}
                    className="text-zinc-600 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-primary-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Join <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
