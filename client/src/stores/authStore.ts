import { create } from 'zustand';
import type { User } from '@/types';
import API from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (formData: FormData) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  updateUser: (userData: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: true,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    const response = await API.post('/auth/login', { email, password });
    const { token, refreshToken, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    set({
      token,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  signup: async (formData: FormData) => {
    await API.post('/auth/signup', formData);
  },

  logout: async () => {
    try {
      await API.post('/auth/logout');
    } catch {
      // Continue logout even if API call fails
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },

  setRefreshToken: (refreshToken: string) => {
    localStorage.setItem('refreshToken', refreshToken);
    set({ refreshToken });
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updated = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    }
  },

  fetchProfile: async () => {
    try {
      const response = await API.get('/protected/profile');
      const user = response.data.user;
      set({ user, loading: false });
    } catch {
      // Token invalid — logout
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  initialize: () => {
    const token = localStorage.getItem('token');
    if (token) {
      get().fetchProfile();
    } else {
      set({ loading: false });
    }
  },
}));
