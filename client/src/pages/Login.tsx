import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Zap, Video, Sparkles, Users, Mail, Lock, Eye, EyeOff, ChevronLeft, Shield, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, setToken, setRefreshToken } = useAuthStore();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Google OAuth redirect
  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    if (token && refreshToken) {
      setToken(token);
      setRefreshToken(refreshToken);
      toast.success('Welcome! Signed in with Google');
      navigate('/dashboard');
    }
    const error = searchParams.get('error');
    if (error) toast.error('OAuth sign-in failed. Please try again.');
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.warning('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `http://${window.location.hostname}:5000/api/auth/google`;
  };

  return (
    <div className="flex min-h-screen bg-surface-600">
      {/* Left Panel — Branding */}
      <div className="flex-1 bg-[linear-gradient(135deg,#0a0a1a_0%,#111128_25%,#0f0f20_50%,#0a0a18_75%,#0d0d22_100%)] flex items-center justify-center p-12 relative overflow-hidden max-lg:hidden">
        <div className="relative z-10 max-w-[480px]">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 font-medium mb-8 hover:text-primary-400 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-accent-500 to-purple-500 flex items-center justify-center mb-8 glow-primary-lg animate-float">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-5xl font-black gradient-text tracking-tight mb-4">IntellMeet</h1>
          <p className="text-lg text-zinc-400 mb-10 leading-relaxed">AI-Powered Enterprise Meeting & Collaboration Platform</p>

          <div className="flex flex-col gap-5 mb-10">
            {[
              { icon: Video, title: 'Real-Time Video', desc: 'HD meetings with screen sharing' },
              { icon: Sparkles, title: 'AI Summaries', desc: 'Automatic transcription & action items' },
              { icon: Users, title: 'Team Collaboration', desc: 'Project boards & task management' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex flex-col">
                  <strong className="text-sm font-semibold text-zinc-200">{f.title}</strong>
                  <span className="text-xs text-zinc-500">{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/15 rounded-full text-xs text-primary-400 font-medium">
            <Shield className="w-3.5 h-3.5" /> Trusted by Zidio Development
          </div>
        </div>

        {/* Decorative orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary-500/15 blur-[120px] -top-24 -right-24 animate-float" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-accent-500/12 blur-[120px] -bottom-12 -left-12 animate-float" style={{ animationDirection: 'reverse' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8 max-w-[560px] overflow-y-auto max-lg:max-w-full">
        <div className="w-full max-w-[400px] animate-fade-in-up">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-2 text-zinc-100">Welcome back</h2>
            <p className="text-zinc-500">Sign in to your IntellMeet account</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-sm font-medium text-zinc-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="login-email" type="email" name="email" placeholder="you@company.com"
                  value={formData.email} onChange={handleChange} autoComplete="email" required
                  className="w-full pl-10 pr-4 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="login-password" type={showPassword ? 'text' : 'password'} name="password"
                  placeholder="Enter your password" value={formData.password} onChange={handleChange}
                  autoComplete="current-password" required
                  className="w-full pl-10 pr-10 py-3 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Google OAuth */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-sm text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <button onClick={handleGoogleLogin}
            className="w-full py-3 bg-surface-200 hover:bg-surface-100 border border-zinc-800 text-zinc-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don't have an account? <Link to="/signup" className="text-primary-400 font-semibold hover:text-primary-300">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
