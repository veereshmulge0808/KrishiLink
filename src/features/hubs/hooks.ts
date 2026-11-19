import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHubs, getHubById, getStockMatrix, updateStockStatus } from '../../lib/api';
import { StockStatus } from '../../types';

export function useHubs() {
  return useQuery({
    queryKey: ['hubs'],
    queryFn: getHubs,
  });
}

export function useHubDetail(id: string) {
  return useQuery({
    queryKey: ['hub', id],
    queryFn: () => getHubById(id),
    enabled: !!id,
  });
}

export function useStockMatrix() {
  return useQuery({
    queryKey: ['stock_matrix'],
    queryFn: getStockMatrix,
    refetchInterval: 5000,
  });
}

export function useUpdateStockStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      hubId,
      cropId,
      status,
      setterName,
    }: {
      hubId: string;
      cropId: string;
      status: StockStatus;
      setterName?: string;
    }) => updateStockStatus(hubId, cropId, status, setterName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock_matrix'] });
    },
  });
}
