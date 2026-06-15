import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Zap, ChevronLeft, User, Mail, Lock, Eye, EyeOff, Upload, Loader2 } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.warning('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      if (avatar) fd.append('avatar', avatar);
      await signup(fd);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-600">
      {/* Left Panel */}
      <div className="flex-1 bg-[linear-gradient(135deg,#0a0a1a_0%,#111128_25%,#0f0f20_50%,#0a0a18_75%,#0d0d22_100%)] flex items-center justify-center p-12 relative overflow-hidden max-lg:hidden">
        <div className="relative z-10 max-w-[480px]">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 font-medium mb-8 hover:text-primary-400 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-accent-500 to-purple-500 flex items-center justify-center mb-8 glow-primary-lg animate-float">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-5xl font-black gradient-text tracking-tight mb-4">Join IntellMeet</h1>
          <p className="text-lg text-zinc-400 leading-relaxed">Create your account and start collaborating with AI-powered meeting intelligence.</p>
        </div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary-500/15 blur-[120px] -top-24 -right-24 animate-float" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent-500/12 blur-[120px] -bottom-12 -left-12 animate-float" style={{ animationDirection: 'reverse' }} />
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8 max-w-[560px] overflow-y-auto max-lg:max-w-full">
        <div className="w-full max-w-[400px] animate-fade-in-up">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-2 text-zinc-100">Create account</h2>
            <p className="text-zinc-500">Get started with IntellMeet</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <label className="relative cursor-pointer group">
                <div className="w-20 h-20 rounded-full bg-surface-200 border-2 border-dashed border-zinc-700 group-hover:border-primary-500/50 flex items-center justify-center overflow-hidden transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-zinc-600 group-hover:text-primary-400 transition-colors" />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <span className="text-xs text-zinc-500">Upload avatar (optional)</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input name="name" placeholder="Your full name" value={formData.name} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters"
                  value={formData.password} onChange={handleChange} required
                  className="w-full pl-10 pr-10 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input name="confirmPassword" type="password" placeholder="Re-enter password"
                  value={formData.confirmPassword} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-400 font-semibold hover:text-primary-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
