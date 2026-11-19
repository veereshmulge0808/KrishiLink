import { useQuery } from '@tanstack/react-query';
import { getCrops, getCropById, getTodayPrices } from '../../lib/api';

export function useCrops(params?: { query?: string; category?: string; organic?: boolean }) {
  return useQuery({
    queryKey: ['crops', params],
    queryFn: () => getCrops(params),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useCropDetail(id: string) {
  return useQuery({
    queryKey: ['crop', id],
    queryFn: () => getCropById(id),
    enabled: !!id,
  });
}

export function useTodayPrices() {
  return useQuery({
    queryKey: ['prices', 'today'],
    queryFn: getTodayPrices,
    staleTime: 1000 * 60 * 10,
  });
}
