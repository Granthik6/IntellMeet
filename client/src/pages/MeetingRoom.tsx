import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMeetingStore } from '@/stores/meetingStore';
import { useMeeting, useUpdateMeetingStatus } from '@/hooks/useMeetings';
import socket from '@/socket';
import VideoRoom from '@/components/VideoRoom';
import ChatBox from '@/components/ChatBox';
import AIPanel from '@/components/AIPanel';
import { toast } from 'sonner';
import {
  MessageSquare, BrainCircuit, Users, ChevronLeft, Copy, Check,
  MicOff, VideoOff, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Participant, TranscriptEntry } from '@/types';

type SidePanel = 'chat' | 'ai' | 'participants' | null;

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { participantStates } = useMeetingStore();
  const { data: meeting, isLoading, error } = useMeeting(id);
  const updateStatus = useUpdateMeetingStatus();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [activePanel, setActivePanel] = useState<SidePanel>('chat');
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socket.off('receiveTranscript');
    socket.on('receiveTranscript', (entry: TranscriptEntry) => {
      setTranscript((prev) => [...prev, entry]);
    });
    return () => { socket.off('receiveTranscript'); };
  }, []);

  const handleJoin = async () => {
    if (meeting && meeting.status === 'scheduled') {
      try { await updateStatus.mutateAsync({ id: id!, status: 'active' }); } catch { /* continue */ }
    }
    setJoined(true);
  };

  const handleCopyCode = () => {
    if (meeting?.meetingCode) {
      navigator.clipboard.writeText(meeting.meetingCode);
      setCopied(true);
      toast.success('Meeting code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    if (id) {
      try { await updateStatus.mutateAsync({ id, status: 'completed' }); } catch { /* continue */ }
    }
    useMeetingStore.getState().reset();
    navigate('/meetings');
  };

  const handleTranscriptUpdate = (entry: TranscriptEntry) => {
    setTranscript((prev) => [...prev, entry]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-600">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  const errResponse = error as any;
  const errorMessage = errResponse?.response?.data?.message;

  if (error || !meeting || meeting.status === 'cancelled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-600 p-6 text-center">
        <div className="w-full max-w-md bg-surface-300 border border-zinc-800 rounded-2xl p-8 animate-scale-in">
          <h2 className="text-xl font-bold text-red-400 mb-2">Cannot Join Meeting</h2>
          <p className="text-sm text-zinc-500 mb-6 font-medium">
            {errorMessage || (meeting?.status === 'cancelled' ? 'This meeting has been cancelled by the host.' : 'Meeting not found or has been deleted.')}
          </p>
          <button onClick={() => navigate('/meetings')} className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg text-sm">
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  // Lobby (pre-join)
  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-600 p-6">
        <div className="w-full max-w-md bg-surface-300 border border-zinc-800 rounded-2xl p-8 animate-scale-in text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-6 glow-primary">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">{meeting?.title || 'Meeting Room'}</h2>
          <p className="text-sm text-zinc-500 mb-6">{meeting?.description || 'Ready to join the meeting?'}</p>

          {meeting?.meetingCode && (
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 bg-surface-200 rounded-xl text-sm font-mono text-zinc-300">
              Code: <strong>{meeting.meetingCode}</strong>
              <button onClick={handleCopyCode} className="text-zinc-500 hover:text-primary-400 transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          <p className="text-xs text-zinc-500 mb-6">Joining as <strong className="text-zinc-300">{user?.name}</strong></p>

          <div className="flex gap-3">
            <button onClick={() => navigate('/meetings')}
              className="flex-1 py-3 bg-surface-200 hover:bg-surface-100 text-zinc-400 font-medium rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleJoin}
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all glow-primary">
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Meeting Room
  const panels: { id: SidePanel; icon: typeof MessageSquare; label: string }[] = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'ai', icon: BrainCircuit, label: 'AI' },
    { id: 'participants', icon: Users, label: 'People' },
  ];

  return (
    <div className="h-screen flex bg-surface-600 overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-500 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleLeave} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">{meeting?.title || 'Meeting'}</h3>
              <p className="text-xs text-zinc-500">{participants.length} participant{participants.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {meeting?.meetingCode && (
              <button onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-200 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {meeting.meetingCode}
              </button>
            )}
            <button onClick={handleLeave}
              className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">
              Leave
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="flex-1 p-4 overflow-hidden">
          <VideoRoom participants={participants} onTranscriptUpdate={handleTranscriptUpdate} />
        </div>
      </div>

      {/* Side Panel */}
      <div className={cn('flex shrink-0 transition-all duration-300', activePanel ? 'w-[360px]' : 'w-[52px]')}>
        {/* Panel Switcher */}
        <div className="w-[52px] bg-surface-500 border-l border-zinc-800 flex flex-col items-center py-3 gap-2 shrink-0">
          {panels.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanel(activePanel === p.id ? null : p.id)}
              title={p.label}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                activePanel === p.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-200'
              )}
            >
              <p.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Panel Content */}
        {activePanel && (
          <div className="flex-1 bg-surface-400 border-l border-zinc-800 flex flex-col overflow-hidden">
            {activePanel === 'chat' && (
              <ChatBox participants={participants} setParticipants={setParticipants} />
            )}
            {activePanel === 'ai' && (
              <AIPanel meetingId={id} transcript={transcript} />
            )}
            {activePanel === 'participants' && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-zinc-800 shrink-0">
                  <h4 className="text-sm font-semibold text-zinc-200">Participants ({participants.length})</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {participants.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-8">No participants yet</p>
                  ) : (
                    participants.map((p, i) => {
                      const state = Object.values(participantStates).find((s) => s.name === p.name);
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                            {p.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                              {p.name} {p.name === user?.name ? '(You)' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {state?.muted && (
                              <span title="Muted" className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                <MicOff className="w-3 h-3 text-red-400" />
                              </span>
                            )}
                            {state?.cameraOff && (
                              <span title="Camera Off" className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                <VideoOff className="w-3 h-3 text-red-400" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
