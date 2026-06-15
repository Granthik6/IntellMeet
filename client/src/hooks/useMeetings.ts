import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/services/api';
import type { Meeting } from '@/types';

// Fetch all meetings
export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await API.get('/meetings');
      return res.data.meetings as Meeting[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch single meeting
export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const res = await API.get(`/meetings/${id}`);
      return res.data as Meeting;
    },
    enabled: !!id,
  });
}

// Fetch meeting by code
export function useMeetingByCode(code: string | undefined) {
  return useQuery({
    queryKey: ['meeting', 'code', code],
    queryFn: async () => {
      const res = await API.get(`/meetings/code/${code}`);
      return res.data as Meeting;
    },
    enabled: !!code,
  });
}

// Create meeting
export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Meeting>) => {
      const res = await API.post('/meetings/create', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

// Update meeting
export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meeting> }) => {
      const res = await API.put(`/meetings/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
    },
  });
}

// Update meeting status
export function useUpdateMeetingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      duration,
    }: {
      id: string;
      status: string;
      duration?: number;
    }) => {
      const res = await API.put(`/meetings/${id}/status`, { status, duration });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
    },
  });
}

// Upload recording
export function useUploadRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, blob }: { id: string; blob: Blob }) => {
      const formData = new FormData();
      formData.append('recording', blob, `recording-${Date.now()}.webm`);
      const res = await API.post(`/meetings/${id}/recording`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
    },
  });
}

// Delete meeting
export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await API.delete(`/meetings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}
