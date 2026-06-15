import { useState } from 'react';
import { useTeams, useCreateTeam, useDeleteTeam } from '@/hooks/useTeams';
import { toast } from 'sonner';
import { Users, PlusCircle, Trash2, UserPlus, Loader2 } from 'lucide-react';

export default function Teams() {
  const { data: teams, isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();

  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) { toast.warning('Team name required'); return; }
    try {
      await createTeam.mutateAsync(newTeam as never);
      toast.success('Team created!');
      setNewTeam({ name: '', description: '' });
      setShowCreate(false);
    } catch { toast.error('Failed to create team'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTeam.mutateAsync(id); toast.success('Team deleted'); }
    catch { toast.error('Failed to delete team'); }
  };

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Teams</h1>
            <p className="text-zinc-400">Manage your teams and members</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all">
            <PlusCircle className="w-5 h-5" /> New Team
          </button>
        </div>

        {/* Create Team Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 mb-6 animate-fade-in-down space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Team Name</label>
              <input value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="e.g., Engineering"
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <input value={newTeam.description} onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} placeholder="What this team does..."
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createTeam.isPending}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2">
                {createTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2 bg-surface-200 text-zinc-400 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : !teams?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-300 border border-zinc-800 rounded-2xl">
            <Users className="w-12 h-12 text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-400">No teams yet</h3>
            <p className="text-sm text-zinc-500">Create your first team to start collaborating</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team._id} className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-amber-400" />
                  </div>
                  <button onClick={() => handleDelete(team._id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h3 className="text-lg font-bold text-zinc-200 mb-1">{team.name}</h3>
                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{team.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <UserPlus className="w-3.5 h-3.5" /> {team.members?.length || 0} members
                  </div>
                  <span className="text-xs text-zinc-600">{new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
