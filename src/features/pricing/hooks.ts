import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPricingForecasts,
  publishPrices,
  getDemandForecasts,
  getAlerts,
  getSettings,
} from '../../lib/api';

export function usePricingForecasts() {
  return useQuery({
    queryKey: ['pricing_forecasts'],
    queryFn: getPricingForecasts,
  });
}

export function useDemandForecasts() {
  return useQuery({
    queryKey: ['demand_forecasts'],
    queryFn: getDemandForecasts,
  });
}

export function usePublishPrices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishPrices,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing_forecasts'] });
      qc.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 5000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });
}
