import { useQuery } from '@tanstack/react-query';
import API from '@/services/api';
import type { Analytics } from '@/types';

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await API.get('/analytics');
      return res.data as Analytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
