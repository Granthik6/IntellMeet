import { useQuery } from '@tanstack/react-query';
import API from '@/services/api';
import type { User } from '@/types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await API.get('/auth/users');
      return res.data.users as User[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
