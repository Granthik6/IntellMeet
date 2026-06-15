import { useAnalytics } from '@/hooks/useAnalytics';
import { useMeetings } from '@/hooks/useMeetings';
import { BarChart3, Video, Users, CheckCircle2, Clock, TrendingUp, Loader2, Zap } from 'lucide-react';

export default function Analytics() {
  const { data: analytics, isLoading } = useAnalytics();
  const { data: meetings } = useMeetings();

  const completed = meetings?.filter((m) => m.status === 'completed') || [];
  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((sum, m) => sum + (m.duration || 0), 0) / completed.length / 60)
    : 0;

  const stats = [
    { label: 'Total Meetings', value: analytics?.totalMeetings || 0, icon: Video, color: 'from-primary-500 to-accent-500', change: '+12%' },
    { label: 'Active Meetings', value: analytics?.activeMeetings || 0, icon: Zap, color: 'from-emerald-500 to-teal-500', change: 'Live' },
    { label: 'Completed', value: analytics?.completedMeetings || 0, icon: CheckCircle2, color: 'from-amber-500 to-orange-500', change: '+8%' },
    { label: 'Total Tasks', value: analytics?.totalTasks || 0, icon: BarChart3, color: 'from-pink-500 to-rose-500', change: '+5%' },
    { label: 'Teams', value: analytics?.teamsCount || 0, icon: Users, color: 'from-cyan-500 to-blue-500', change: 'Active' },
    { label: 'Avg Duration', value: `${avgDuration}m`, icon: Clock, color: 'from-violet-500 to-purple-500', change: '~' },
  ];

  if (isLoading) {
    return (
      <div className="page-content flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Analytics</h1>
          <p className="text-zinc-400">Overview of your meeting and productivity metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-zinc-100 mb-1">{stat.value}</p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-zinc-200 mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" /> Recent Completed Meetings
          </h3>
          {completed.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No completed meetings to analyze</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-2 text-zinc-500 font-medium">Meeting</th>
                    <th className="text-left py-3 px-2 text-zinc-500 font-medium">Date</th>
                    <th className="text-left py-3 px-2 text-zinc-500 font-medium">Participants</th>
                    <th className="text-left py-3 px-2 text-zinc-500 font-medium">Duration</th>
                    <th className="text-left py-3 px-2 text-zinc-500 font-medium">Transcript</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.slice(0, 10).map((m) => (
                    <tr key={m._id} className="border-b border-zinc-800/50 hover:bg-surface-200 transition-colors">
                      <td className="py-3 px-2 text-zinc-200 font-medium">{m.title}</td>
                      <td className="py-3 px-2 text-zinc-400">{new Date(m.date).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-zinc-400">{m.participants?.length || 0}</td>
                      <td className="py-3 px-2 text-zinc-400">{m.duration ? `${Math.round(m.duration / 60)}m` : '—'}</td>
                      <td className="py-3 px-2 text-zinc-400">{m.transcript?.length || 0} entries</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
