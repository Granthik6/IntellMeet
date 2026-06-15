import { useState, useRef, useEffect, useCallback } from 'react';
import socket from '@/socket';
import { useAuthStore } from '@/stores/authStore';
import { useMeetingStore } from '@/stores/meetingStore';
import { useUploadRecording } from '@/hooks/useMeetings';
import { useParams } from 'react-router-dom';
import {
  MicOff, VideoOff, Mic, Video, MonitorUp, PhoneOff, Phone,
  Check, X, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Participant } from '@/types';

interface VideoRoomProps {
  participants: Participant[];
  onTranscriptUpdate?: (entry: { speaker: string; text: string; timestamp: string }) => void;
}

export default function VideoRoom({ participants, onTranscriptUpdate }: VideoRoomProps) {
  const { user } = useAuthStore();
  const { id: meetingId } = useParams();
  const { isMuted, cameraOff, isRecording, isScreenSharing, isTranscribing,
    toggleMute: storeToggleMute, toggleCamera: storeToggleCamera,
    setRecording, setScreenSharing, setTranscribing } = useMeetingStore();
  const uploadRecording = useUploadRecording();

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [me, setMe] = useState('');
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [callerSocketId, setCallerSocketId] = useState('');
  const [remoteSocketId, setRemoteSocketId] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploadingRecording, setUploadingRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const originalStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    startVideo();

    socket.on('connect', () => setMe(socket.id || ''));

    socket.off('offer');
    socket.on('offer', async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      setIncomingOffer(offer);
      setCallerSocketId(from);
    });

    socket.off('answer');
    socket.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.off('ice-candidate');
    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('connect');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      stopTranscription();
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callActive) {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      originalStreamRef.current = mediaStream;
      if (myVideo.current) myVideo.current.srcObject = mediaStream;
    } catch {
      console.log('Camera access denied');
    }
  };

  const toggleMute = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      storeToggleMute();
      socket.emit('muteStatus', {
        meetingId: (socket as unknown as Record<string, string>).meetingId,
        sender: user?.name,
        muted: !audioTrack.enabled,
      });
    }
  };

  const toggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      storeToggleCamera();
      socket.emit('cameraStatus', {
        meetingId: (socket as unknown as Record<string, string>).meetingId,
        sender: user?.name,
        cameraOff: !videoTrack.enabled,
      });
    }
  };

  // Transcription
  const startTranscription = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text.length > 0) {
            const entry = {
              speaker: user?.name || 'You',
              text,
              timestamp: new Date().toISOString(),
            };
            if ((socket as unknown as Record<string, string>).meetingId) {
              socket.emit('sendTranscript', {
                meetingId: (socket as unknown as Record<string, string>).meetingId,
                ...entry,
              });
            }
            onTranscriptUpdate?.(entry);
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') setTranscribing(false);
    };

    recognition.onend = () => {
      if (isTranscribing && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already started */ }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setTranscribing(true);
    } catch {
      toast.error('Failed to start transcription');
    }
  }, [user, isTranscribing, onTranscriptUpdate, setTranscribing]);

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      setTranscribing(false);
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
  }, [setTranscribing]);

  const toggleTranscription = () => {
    if (isTranscribing) stopTranscription();
    else startTranscription();
  };

  // Screen share
  const shareScreen = async () => {
    if (isScreenSharing) {
      if (originalStreamRef.current && myVideo.current) {
        myVideo.current.srcObject = originalStreamRef.current;
        if (peerConnection.current) {
          const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(originalStreamRef.current.getVideoTracks()[0]);
        }
      }
      setScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (myVideo.current) myVideo.current.srcObject = screenStream;
      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      }
      setScreenSharing(true);

      screenTrack.onended = () => {
        if (originalStreamRef.current) {
          if (myVideo.current) myVideo.current.srcObject = originalStreamRef.current;
          if (peerConnection.current) {
            const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(originalStreamRef.current.getVideoTracks()[0]);
          }
        }
        setScreenSharing(false);
      };
    } catch {
      console.log('Screen share cancelled');
    }
  };

  // Recording with Cloudinary upload
  const startRecordingFn = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

      // Upload to Cloudinary via backend
      if (meetingId) {
        setUploadingRecording(true);
        try {
          await uploadRecording.mutateAsync({ id: meetingId, blob });
          toast.success('Recording uploaded successfully!');
        } catch {
          toast.error('Failed to upload recording. Downloading locally...');
          // Fallback: local download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `meeting-recording-${new Date().toISOString().slice(0, 10)}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        } finally {
          setUploadingRecording(false);
        }
      }
    };
    mediaRecorderRef.current.start();
    setRecording(true);
    toast.success('Recording started');
  };

  const stopRecordingFn = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // WebRTC
  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    if (stream) {
      stream.getTracks().forEach((track) => peerConnection.current!.addTrack(track, stream));
    }
    peerConnection.current.ontrack = (event) => {
      if (userVideo.current) userVideo.current.srcObject = event.streams[0];
    };
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { target: remoteSocketId || callerSocketId, candidate: event.candidate });
      }
    };
  };

  const createOffer = async (targetSocketId: string) => {
    setRemoteSocketId(targetSocketId);
    createPeerConnection();
    const offer = await peerConnection.current!.createOffer();
    await peerConnection.current!.setLocalDescription(offer);
    setCallActive(true);
    socket.emit('offer', { target: targetSocketId, offer });
  };

  const answerCall = async () => {
    createPeerConnection();
    await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(incomingOffer!));
    const answer = await peerConnection.current!.createAnswer();
    await peerConnection.current!.setLocalDescription(answer);
    setCallActive(true);
    setIncomingOffer(null);
    socket.emit('answer', { target: callerSocketId, answer });
    setCallerSocketId('');
  };

  const endCall = () => {
    setSeconds(0);
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (userVideo.current) userVideo.current.srcObject = null;
    setIncomingOffer(null);
    setCallerSocketId('');
    setCallActive(false);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const remoteParticipants = participants.filter((p) => p.socketId !== socket.id);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Timer */}
      {callActive && (
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-300 border border-zinc-800 rounded-full text-sm font-semibold font-mono text-zinc-200 self-center">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {formatTime(seconds)}
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 grid gap-3 min-h-[300px] relative">
        {/* My Video */}
        <div className={cn(
          'relative rounded-2xl overflow-hidden bg-surface-200 border border-zinc-800',
          callActive ? 'absolute bottom-4 right-4 w-52 h-40 z-10 shadow-2xl border-2 border-zinc-700' : 'min-h-[300px]'
        )}>
          <video ref={myVideo} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
            <span>{user?.name || 'You'} (You)</span>
            {isMuted && <MicOff className="w-3 h-3" />}
            {cameraOff && <VideoOff className="w-3 h-3" />}
            {isTranscribing && <Mic className="w-3 h-3 text-emerald-400" />}
          </div>
          {cameraOff && (
            <div className="absolute inset-0 bg-surface-200 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl font-bold text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          )}
        </div>

        {/* Remote Video */}
        {callActive && (
          <div className="relative rounded-2xl overflow-hidden bg-surface-200 border border-zinc-800 min-h-[300px]">
            <video ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
              Remote User
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-3">
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className={cn(
            'w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-105',
            isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-surface-300 border-zinc-700 text-zinc-300 hover:bg-surface-100'
          )}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleCamera}
          title={cameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          className={cn(
            'w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-105',
            cameraOff ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-surface-300 border-zinc-700 text-zinc-300 hover:bg-surface-100'
          )}
        >
          {cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={shareScreen}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          className={cn(
            'w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-105',
            isScreenSharing ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-surface-300 border-zinc-700 text-zinc-300 hover:bg-surface-100'
          )}
        >
          <MonitorUp className="w-5 h-5" />
        </button>

        <button
          onClick={isRecording ? stopRecordingFn : startRecordingFn}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
          disabled={uploadingRecording}
          className={cn(
            'w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-105',
            isRecording ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-surface-300 border-zinc-700 text-zinc-300 hover:bg-surface-100',
            uploadingRecording && 'opacity-50 cursor-not-allowed'
          )}
        >
          {uploadingRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? '⏹' : '⏺'}
        </button>

        <button
          onClick={toggleTranscription}
          title={isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
          className={cn(
            'w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-105',
            isTranscribing
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-surface-300 border-zinc-700 text-zinc-300 hover:bg-surface-100'
          )}
        >
          <Mic className="w-5 h-5" />
        </button>

        {callActive && (
          <button
            onClick={endCall}
            title="End Call"
            className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-red-500/30"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Participants to Call */}
      {remoteParticipants.length > 0 && !callActive && (
        <div className="bg-surface-300 border border-zinc-800 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-zinc-200 mb-3">Participants in Room</h4>
          {remoteParticipants.map((p, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                {p.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="flex-1 text-sm font-medium text-zinc-200">{p.name}</span>
              <button
                onClick={() => createOffer(p.socketId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Incoming Call */}
      {incomingOffer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-surface-50 border border-zinc-800 rounded-2xl p-8 text-center animate-scale-in shadow-2xl">
            <div className="text-5xl mb-4 animate-float">
              <Phone className="w-12 h-12 text-primary-400 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Incoming Call</h3>
            <p className="text-sm text-zinc-400 mb-6">Someone is calling you</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={answerCall}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => setIncomingOffer(null)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" /> Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
