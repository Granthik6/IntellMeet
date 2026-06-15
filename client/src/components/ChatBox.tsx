import { useEffect, useState, useRef } from 'react';
import socket from '@/socket';
import API from '@/services/api';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMeetingStore } from '@/stores/meetingStore';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, Participant } from '@/types';

interface ChatBoxProps {
  participants: Participant[];
  setParticipants: (p: Participant[]) => void;
}

export default function ChatBox({ participants, setParticipants }: ChatBoxProps) {
  const { id } = useParams();
  const { user } = useAuthStore();
  const meetingId = id || '';
  const sender = user?.name || 'Anonymous';

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasJoined) joinRoom();

    socket.off('receiveMessage');
    socket.off('systemMessage');
    socket.off('participantsUpdate');
    socket.off('userTyping');
    socket.off('participantStatesUpdate');

    socket.on('receiveMessage', (data: { sender: string; message: string }) => {
      setMessages((prev) => [...prev, { ...data, type: 'message' }]);
    });

    socket.on('systemMessage', (data: { sender: string; message: string }) => {
      setMessages((prev) => [...prev, { ...data, type: 'system' }]);
    });

    socket.on('participantsUpdate', (users: Participant[]) => {
      setParticipants(users);
    });

    socket.on('participantStatesUpdate', (states: Record<string, Participant>) => {
      useMeetingStore.getState().setParticipantStates(states);
    });

    socket.on('userTyping', (who: string) => {
      setTypingUser(who);
      setTimeout(() => setTypingUser(''), 3000);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('systemMessage');
      socket.off('participantsUpdate');
      socket.off('userTyping');
      socket.off('participantStatesUpdate');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinRoom = async () => {
    try {
      const response = await API.get(`/messages/${meetingId}`);
      setMessages(
        response.data.map((msg: { sender: string; text: string; createdAt: string }) => ({
          sender: msg.sender,
          message: msg.text,
          type: 'message' as const,
          createdAt: msg.createdAt,
        }))
      );
    } catch {
      // no messages yet
    }

    socket.emit('joinRoom', { meetingId, sender });
    setHasJoined(true);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await API.post('/messages', { sender, meetingId, text: message });
    } catch {
      // continue
    }
    socket.emit('sendMessage', { meetingId, sender, message });
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[200px]">
            <MessageSquare className="w-7 h-7 text-zinc-600" />
            <p className="text-sm text-zinc-500">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div key={index} className="text-center text-xs text-zinc-500 px-3 py-1 bg-surface-200 rounded-full self-center">
                {msg.message}
              </div>
            );
          }
          const isMe = msg.sender === sender;
          return (
            <div key={index} className={cn('flex gap-2 items-end max-w-[85%]', isMe && 'self-end flex-row-reverse')}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {msg.sender?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {!isMe && <span className="text-[11px] font-semibold text-primary-400 pl-2">{msg.sender}</span>}
                <div className={cn(
                  'px-3 py-2 text-sm leading-relaxed break-words',
                  isMe
                    ? 'bg-primary-500 text-white rounded-2xl rounded-br-sm'
                    : 'bg-surface-200 text-zinc-200 rounded-2xl rounded-bl-sm'
                )}>
                  {msg.message}
                </div>
                {msg.createdAt && (
                  <span className={cn('text-[10px] text-zinc-600', isMe ? 'text-right pr-2' : 'pl-2')}>
                    {formatTime(msg.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {typingUser && typingUser !== sender && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 px-2">
            <span className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse" />
              <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse delay-100" />
              <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse delay-200" />
            </span>
            {typingUser} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-zinc-800 bg-surface-500">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            socket.emit('typing', { meetingId, sender });
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2 bg-surface-400 border border-zinc-800 rounded-full text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all"
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center transition-colors shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
