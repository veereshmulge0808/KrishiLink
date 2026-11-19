import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSettlements,
  approveSettlement,
  triggerPayouts,
  getFarmerPayments,
} from '../../lib/api';

export function useFarmerPayments(farmerId?: string) {
  return useQuery({
    queryKey: ['farmer_payments', farmerId],
    queryFn: () => getFarmerPayments(farmerId),
  });
}

export function useAdminSettlements() {
  return useQuery({
    queryKey: ['admin_settlements'],
    queryFn: getAdminSettlements,
  });
}

export function useApproveSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveSettlement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_settlements'] });
    },
  });
}

export function useTriggerPayouts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerPayouts,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_settlements'] });
    },
  });
}
