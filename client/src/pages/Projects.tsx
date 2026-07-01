import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useTeams } from '@/hooks/useTeams';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { FolderKanban, PlusCircle, Trash2, CheckCircle2, Circle, Clock, Loader2, ArrowUpCircle, UserPlus, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Projects() {
  const { data: tasks, isLoading } = useTasks();
  const { data: teams } = useTeams();
  const { data: users } = useUsers();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('personal');
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium', 
    dueDate: '', 
    assignee: '' 
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) { toast.warning('Task title required'); return; }
    try {
      const data: any = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
        assignee: newTask.assignee || undefined,
        status: 'todo',
      };
      
      if (selectedWorkspace !== 'personal') {
        data.team = selectedWorkspace;
      }

      await createTask.mutateAsync(data);
      toast.success('Task created successfully!');
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignee: '' });
      setShowCreate(false);
    } catch { 
      toast.error('Failed to create task'); 
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try { 
      await updateTask.mutateAsync({ id, data: { status } as any }); 
      toast.success(`Task moved to ${status}`);
    } catch { 
      toast.error('Failed to update task status'); 
    }
  };

  const handleDeleteTask = async (id: string) => {
    try { 
      await deleteTask.mutateAsync(id); 
      toast.success('Task deleted'); 
    } catch { 
      toast.error('Failed to delete task'); 
    }
  };

  // Get active team details
  const activeTeam = teams?.find(t => t._id === selectedWorkspace);

  // Filter tasks by selected workspace
  const filteredTasks = tasks?.filter((t) => {
    if (selectedWorkspace === 'personal') {
      return !t.team;
    } else {
      const taskTeamId = typeof t.team === 'object' && t.team ? t.team._id : t.team;
      return taskTeamId === selectedWorkspace;
    }
  }) || [];

  // Filter assignable users based on workspace
  const assignableUsers = selectedWorkspace === 'personal'
    ? users || []
    : activeTeam?.members?.map(m => m.user) || [];

  const columns = [
    { key: 'todo' as const, label: 'To Do', icon: Circle, color: 'text-zinc-500' },
    { key: 'in-progress' as const, label: 'In Progress', icon: Clock, color: 'text-amber-500' },
    { key: 'review' as const, label: 'In Review', icon: ShieldAlert, color: 'text-primary-400' },
    { key: 'completed' as const, label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  const priorityColors: Record<string, string> = {
    urgent: 'bg-rose-500/20 text-rose-400 border border-rose-500/20',
    high: 'bg-red-500/20 text-red-400 border border-red-500/20',
    medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/20',
    low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
  };

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Project Board</h1>
            <p className="text-zinc-400 text-sm">Manage and track collaborative sprints</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary-500/20">
            <PlusCircle className="w-5 h-5" /> New Task
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setSelectedWorkspace('personal')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-all',
              selectedWorkspace === 'personal'
                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            Personal Workspace
          </button>
          {teams?.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelectedWorkspace(t._id)}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-lg transition-all',
                selectedWorkspace === t._id
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {t.name} Workspace
            </button>
          ))}
        </div>

        {/* Workspace details banner */}
        {selectedWorkspace !== 'personal' && activeTeam && (
          <div className="bg-surface-300 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-200">{activeTeam.name} Workspace</h4>
              <p className="text-xs text-zinc-500 mt-1">{activeTeam.description || 'Collaborative team tasks'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> {activeTeam.members?.length || 0} members</span>
            </div>
          </div>
        )}

        {/* Create Task Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 mb-8 animate-fade-in-down space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-zinc-200">Create Workspace Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Title</label>
                <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title"
                  className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all font-medium" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all font-semibold">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assignee</label>
                  <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all font-semibold">
                    <option value="">Unassigned</option>
                    {assignableUsers.map((user: any) => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all font-semibold" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</label>
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task details and expectations..." rows={3}
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 resize-none transition-all font-medium" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={createTask.isPending}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-2">
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Task
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 bg-surface-200 text-zinc-400 font-semibold rounded-lg text-sm transition-all hover:bg-surface-100">Cancel</button>
            </div>
          </form>
        )}

        {/* Kanban Board columns */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-300 border border-zinc-800 rounded-2xl">
            <FolderKanban className="w-12 h-12 text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-400">No tasks in this workspace</h3>
            <p className="text-sm text-zinc-500">Create your first task to populate the board</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter(
                (t) => t.status === col.key || (col.key === 'completed' && t.status === 'done')
              );
              return (
                <div key={col.key} className="bg-surface-300 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-3 min-h-[400px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/40">
                    <div className="flex items-center gap-2">
                      <col.icon className={cn('w-4.5 h-4.5', col.color)} />
                      <h3 className="text-sm font-bold text-zinc-200">{col.label}</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface-200 text-zinc-500">{colTasks.length}</span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-zinc-800/30 rounded-xl">
                        <span className="text-xs text-zinc-600 font-medium">Empty</span>
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div key={task._id} className="bg-surface-200 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-200 hover:shadow-lg group">
                          {/* Task Title & Action */}
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h4 className="text-sm font-semibold text-zinc-200 leading-snug group-hover:text-primary-300 transition-colors">{task.title}</h4>
                            <button onClick={() => handleDeleteTask(task._id)}
                              className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>

                          {/* Description */}
                          {task.description && <p className="text-xs text-zinc-500 mb-3 leading-relaxed line-clamp-2">{task.description}</p>}

                          {/* Tags & Assignee */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/40 pt-3">
                            <div className="flex flex-wrap gap-1.5">
                              <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider', priorityColors[task.priority] || priorityColors.medium)}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-surface-300 text-zinc-400 border border-zinc-800">
                                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>

                            {/* Assignee Avatar */}
                            {task.assignee && (
                              <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee.name || task.assignee}`}>
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                  {task.assignee.avatar ? (
                                    <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    (task.assignee.name || task.assignee).charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-400 font-semibold max-w-[60px] truncate">{task.assignee.name || task.assignee}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Transitions */}
                          <div className="flex gap-1.5 mt-3 border-t border-zinc-800/40 pt-2.5">
                            {columns.filter((c) => c.key !== task.status).map((c) => (
                              <button key={c.key} onClick={() => handleStatusUpdate(task._id, c.key)}
                                className="text-[9px] font-bold px-2 py-1 bg-surface-300 hover:bg-surface-400 hover:text-zinc-200 text-zinc-500 rounded-md transition-colors">
                                Move to {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
