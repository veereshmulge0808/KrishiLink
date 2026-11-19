import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFarmerListings,
  createFarmerListing,
  deleteFarmerListing,
  getFarmerThreshold,
  updateFarmerThreshold,
  getFarmerPickup,
} from '../../lib/api';

export function useFarmerListings(farmerId?: string) {
  return useQuery({
    queryKey: ['farmer_listings', farmerId],
    queryFn: () => getFarmerListings(farmerId),
  });
}

export function useFarmerThreshold(farmerId?: string) {
  return useQuery({
    queryKey: ['farmer_threshold', farmerId],
    queryFn: () => getFarmerThreshold(farmerId),
  });
}

export function useUpdateFarmerThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ farmerId, data }: { farmerId?: string; data: any }) =>
      updateFarmerThreshold(farmerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer_threshold'] });
    },
  });
}

export function useCreateFarmerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFarmerListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer_listings'] });
    },
  });
}

export function useDeleteFarmerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFarmerListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer_listings'] });
    },
  });
}

export function useFarmerPickup(farmerId?: string) {
  return useQuery({
    queryKey: ['farmer_pickup', farmerId],
    queryFn: () => getFarmerPickup(farmerId),
    refetchInterval: 5000,
  });
}
