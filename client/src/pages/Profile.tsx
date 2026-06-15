import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import API from '@/services/api';
import { toast } from 'sonner';
import { User, Mail, Camera, Briefcase, FileText, Loader2, Shield } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    department: user?.department || '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('bio', formData.bio);
      fd.append('department', formData.department);
      if (avatar) fd.append('avatar', avatar);

      const res = await API.put('/auth/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Profile</h1>
          <p className="text-zinc-400">Manage your account settings and profile</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-300 border border-zinc-800 rounded-2xl p-8 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <label className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-2xl bg-surface-200 border-2 border-zinc-700 group-hover:border-primary-500/50 flex items-center justify-center overflow-hidden transition-all">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            <div>
              <h3 className="text-lg font-bold text-zinc-200">{user?.name}</h3>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-xs font-medium text-primary-400">{user?.role}</span>
              </div>
            </div>
          </div>

          <hr className="border-zinc-800" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><User className="w-4 h-4 text-primary-400" /> Full Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Mail className="w-4 h-4 text-primary-400" /> Email</label>
              <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email"
                className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary-400" /> Department</label>
            <input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Engineering, Design, etc."
              className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><FileText className="w-4 h-4 text-primary-400" /> Bio</label>
            <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3}
              className="w-full px-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 resize-none transition-all" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </form>

        {/* Account Info */}
        <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-6 mt-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Account Type</span><span className="text-zinc-300 font-medium">{user?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Role</span><span className="text-zinc-300 font-medium">{user?.role}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Member Since</span><span className="text-zinc-300 font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
