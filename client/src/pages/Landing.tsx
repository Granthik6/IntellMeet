import { useNavigate } from 'react-router-dom';
import {
  Zap, Video, Sparkles, Users, BarChart3, Shield, ArrowRight,
  CheckCircle2, MonitorPlay, BrainCircuit, Globe, Clock, Star,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Video, title: 'HD Video Meetings', desc: 'Crystal-clear video and audio powered by WebRTC with real-time screen sharing.', color: 'from-primary-500 to-accent-500' },
    { icon: BrainCircuit, title: 'AI Summaries', desc: 'Automatic meeting transcription, smart summaries, and action item extraction.', color: 'from-emerald-500 to-teal-500' },
    { icon: Users, title: 'Team Collaboration', desc: 'Project boards, task management, and team workspaces for seamless productivity.', color: 'from-amber-500 to-orange-500' },
    { icon: MonitorPlay, title: 'Screen Recording', desc: 'Record meetings with cloud storage. Never miss a detail — review anytime.', color: 'from-pink-500 to-rose-500' },
    { icon: Shield, title: 'Enterprise Security', desc: 'JWT authentication with refresh tokens, role-based access, and Redis-backed sessions.', color: 'from-cyan-500 to-blue-500' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track meeting metrics, participant activity, and team productivity.', color: 'from-violet-500 to-purple-500' },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime' },
    { value: '<100ms', label: 'Latency' },
    { value: '256-bit', label: 'Encryption' },
    { value: '24/7', label: 'Support' },
  ];

  const techStack = [
    'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'TanStack Query',
    'Zustand', 'Node.js', 'Express 5', 'MongoDB', 'Redis', 'Socket.io', 'WebRTC',
  ];

  return (
    <div className="min-h-screen bg-surface-600 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-surface-600/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-accent-500 to-purple-500 flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">IntellMeet</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/signup')}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/20">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-xs font-medium text-primary-400 mb-8 animate-fade-in">
            <Star className="w-3.5 h-3.5" /> Built for Zidio Development
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-[1.1] mb-6 animate-fade-in-up">
            <span className="gradient-text">AI-Powered</span>
            <br />
            <span className="text-zinc-100">Meeting Platform</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-100">
            Transform your meetings with real-time video conferencing, AI-generated summaries,
            smart action items, and seamless team collaboration.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in-up delay-200">
            <button onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-primary-500/20 flex items-center gap-2 text-lg">
              Start Free <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')}
              className="px-8 py-4 bg-surface-200 hover:bg-surface-100 text-zinc-300 font-semibold rounded-2xl border border-zinc-800 transition-all flex items-center gap-2">
              <Globe className="w-5 h-5" /> Live Demo
            </button>
          </div>
        </div>

        {/* Hero orbs */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-primary-500/10 blur-[150px] top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-accent-500/8 blur-[120px] bottom-0 right-0 pointer-events-none animate-float" />
      </section>

      {/* Stats Bar */}
      <section className="py-10 border-y border-zinc-800 bg-surface-500/50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-black gradient-text mb-1">{s.value}</p>
              <p className="text-sm text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Everything you need for
              <span className="gradient-text"> productive meetings</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              A complete platform for video conferencing, AI-powered insights, and team collaboration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-surface-300 border border-zinc-800 rounded-2xl p-7 hover:border-zinc-700 transition-all group animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-zinc-200 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-zinc-200 mb-8">Built with modern tech stack</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech, i) => (
              <span key={i} className="px-4 py-2 bg-surface-300 border border-zinc-800 rounded-xl text-sm text-zinc-400 font-medium hover:border-primary-500/30 hover:text-primary-400 transition-all">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-black mb-4">Ready to transform your meetings?</h2>
          <p className="text-zinc-400 mb-8">Join the platform that reduces meeting follow-up time by 40-60%.</p>
          <button onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-primary-500/20 flex items-center gap-2 mx-auto text-lg">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-primary-500/8 blur-[150px] bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-semibold text-zinc-400">IntellMeet</span>
          </div>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Zidio Development. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Built with <Clock className="w-3 h-3" /> care
          </div>
        </div>
      </footer>
    </div>
  );
}
