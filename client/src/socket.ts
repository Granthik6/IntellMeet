import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:5000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);

  // Re-register user if token exists
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed?.id) {
        socket.emit('registerUser', { userId: parsed.id });
      }
    } catch {
      // ignore
    }
  }
});

socket.on('connect_error', (err) => {
  console.log('❌ Socket connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Socket disconnected:', reason);
});

export default socket;
