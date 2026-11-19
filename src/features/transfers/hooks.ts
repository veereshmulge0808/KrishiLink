import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransfers, createTransfer, updateTransferStatus } from '../../lib/api';

export function useTransfers(status?: string) {
  return useQuery({
    queryKey: ['transfers', status],
    queryFn: () => getTransfers(status),
    refetchInterval: 5000,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useUpdateTransferStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      updateTransferStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}
