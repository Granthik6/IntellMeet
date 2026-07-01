import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import CreateMeeting from '@/pages/CreateMeeting';
import Meetings from '@/pages/Meetings';
import MeetingRoom from '@/pages/MeetingRoom';
import Profile from '@/pages/Profile';
import Teams from '@/pages/Teams';
import Projects from '@/pages/Projects';
import Analytics from '@/pages/Analytics';
import MeetingHistory from '@/pages/MeetingHistory';
import MeetingSummary from '@/pages/MeetingSummary';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, initialize } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const publicPaths = ['/', '/login', '/signup'];
  const isMeetingRoom = location.pathname.startsWith('/meeting/') && !location.pathname.startsWith('/meeting-summary');
  const showLayout =
    isAuthenticated && !publicPaths.includes(location.pathname) && !isMeetingRoom;

  return (
    <>
      {showLayout && (
        <>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <Navbar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </>
      )}
      <div className={showLayout ? `main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}` : ''}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-meeting" element={<ProtectedRoute><CreateMeeting /></ProtectedRoute>} />
          <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
          <Route path="/meeting/:id" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/meeting-history" element={<ProtectedRoute><MeetingHistory /></ProtectedRoute>} />
          <Route path="/meeting-summary/:id" element={<ProtectedRoute><MeetingSummary /></ProtectedRoute>} />
        </Routes>
      </div>

      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161f',
            border: '1px solid #1e293b',
            color: '#f1f5f9',
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
