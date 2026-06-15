import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { FolderKanban, PlusCircle, Trash2, CheckCircle2, Circle, Clock, Loader2, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Projects() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) { toast.warning('Task title required'); return; }
    try {
      await createTask.mutateAsync(newTask as never);
      toast.success('Task created!');
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
      setShowCreate(false);
    } catch { toast.error('Failed to create task'); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try { await updateTask.mutateAsync({ id, data: { status } as never }); }
    catch { toast.error('Failed to update task'); }
  };

  const handleDeleteTask = async (id: string) => {
    try { await deleteTask.mutateAsync(id); toast.success('Task deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const columns = [
    { key: 'todo', label: 'To Do', icon: Circle, color: 'text-zinc-400' },
    { key: 'in-progress', label: 'In Progress', icon: Clock, color: 'text-amber-400' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="page-content">
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Projects & Tasks</h1>
            <p className="text-zinc-400">Track and manage your tasks across projects</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all">
            <PlusCircle className="w-5 h-5" /> New Task
          </button>
        </div>

        {/* Create Task Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 mb-6 animate-fade-in-down space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Title</label>
                <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title"
                  className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 transition-all" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task details..." rows={2}
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 resize-none transition-all" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createTask.isPending}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2">
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2 bg-surface-200 text-zinc-400 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : !tasks?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-300 border border-zinc-800 rounded-2xl">
            <FolderKanban className="w-12 h-12 text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-400">No tasks yet</h3>
            <p className="text-sm text-zinc-500">Create your first task to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="bg-surface-300 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <col.icon className={cn('w-5 h-5', col.color)} />
                    <h3 className="text-sm font-bold text-zinc-200">{col.label}</h3>
                    <span className="ml-auto text-xs text-zinc-600 bg-surface-200 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div key={task._id} className="bg-surface-200 rounded-xl p-4 hover:bg-surface-100 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-zinc-200">{task.title}</h4>
                          <button onClick={() => handleDeleteTask(task._id)}
                            className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        {task.description && <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', priorityColors[task.priority] || priorityColors.medium)}>
                            <ArrowUpCircle className="w-2.5 h-2.5 inline mr-0.5" />{task.priority}
                          </span>
                          {task.dueDate && <span className="text-[10px] text-zinc-500">{new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                        <div className="flex gap-1">
                          {columns.filter((c) => c.key !== task.status).map((c) => (
                            <button key={c.key} onClick={() => handleStatusUpdate(task._id, c.key)}
                              className="text-[10px] px-2 py-1 bg-surface-300 hover:bg-surface-400 text-zinc-400 rounded transition-colors">
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
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
