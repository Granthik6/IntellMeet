import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMeetings } from '@/hooks/useMeetings';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Video, PlusCircle, Users, BarChart3, Clock, Calendar, Loader2, ArrowRight, Zap } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const { data: analytics } = useAnalytics();

  const upcomingMeetings = meetings?.filter((m) => m.status === 'scheduled').slice(0, 5) || [];
  const recentMeetings = meetings?.filter((m) => m.status === 'completed').slice(0, 5) || [];

  const stats = [
    { label: 'Total Meetings', value: analytics?.totalMeetings || 0, icon: Video, color: 'from-primary-500 to-accent-500' },
    { label: 'Active Now', value: analytics?.activeMeetings || 0, icon: Zap, color: 'from-emerald-500 to-teal-500' },
    { label: 'Teams', value: analytics?.teamsCount || 0, icon: Users, color: 'from-amber-500 to-orange-500' },
    { label: 'Tasks', value: analytics?.totalTasks || 0, icon: BarChart3, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-zinc-400">Here's what's happening with your meetings today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-surface-300 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-100 mb-1">{stat.value}</p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => navigate('/create-meeting')}
            className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/20">
            <PlusCircle className="w-5 h-5" /> New Meeting
          </button>
          <button onClick={() => navigate('/meetings')}
            className="flex items-center gap-2 px-5 py-3 bg-surface-200 hover:bg-surface-100 text-zinc-300 font-medium rounded-xl border border-zinc-800 transition-all">
            <Video className="w-5 h-5" /> View Meetings
          </button>
          <button onClick={() => navigate('/teams')}
            className="flex items-center gap-2 px-5 py-3 bg-surface-200 hover:bg-surface-100 text-zinc-300 font-medium rounded-xl border border-zinc-800 transition-all">
            <Users className="w-5 h-5" /> Manage Teams
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Meetings */}
          <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-400" /> Upcoming
              </h3>
              <button onClick={() => navigate('/meetings')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {meetingsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
            ) : upcomingMeetings.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">No upcoming meetings</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingMeetings.map((m) => (
                  <div key={m._id} onClick={() => navigate(`/meeting/${m._id}`)}
                    className="flex items-center gap-4 p-4 bg-surface-200 rounded-xl cursor-pointer hover:bg-surface-100 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{m.title}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-primary-400 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Meetings */}
          <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" /> Recent
              </h3>
              <button onClick={() => navigate('/meeting-history')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {meetingsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
            ) : recentMeetings.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">No completed meetings</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentMeetings.map((m) => (
                  <div key={m._id} className="flex items-center gap-4 p-4 bg-surface-200 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <Video className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{m.title}</p>
                      <p className="text-xs text-zinc-500">
                        {m.duration ? `${Math.round(m.duration / 60)} min` : 'Completed'} · {m.participants?.length || 0} participants
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full">Done</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
