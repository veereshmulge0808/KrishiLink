import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDriverTrips,
  getDriverTripById,
  acknowledgeTrip,
  startTrip,
  arriveAtStop,
  submitPickupReceipt,
  submitDelivery,
  skipStop,
  reachedHub,
  returnTrip,
  getAdminTrips,
  getAdminTripById,
  assignTrip,
} from '../../lib/api';

export function useDriverTrips(driverId?: string) {
  return useQuery({
    queryKey: ['driver_trips', driverId],
    queryFn: () => getDriverTrips(driverId),
  });
}

export function useDriverTrip(id: string) {
  return useQuery({
    queryKey: ['driver_trip', id],
    queryFn: () => getDriverTripById(id),
    enabled: !!id,
    refetchInterval: 3000,
  });
}

export function useAdminTrips() {
  return useQuery({
    queryKey: ['admin_trips'],
    queryFn: getAdminTrips,
    refetchInterval: 5000,
  });
}

export function useAdminTrip(id: string) {
  return useQuery({
    queryKey: ['admin_trip', id],
    queryFn: () => getAdminTripById(id),
    enabled: !!id,
    refetchInterval: 3000,
  });
}

export function useAcknowledgeTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeTrip,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', id] });
      qc.invalidateQueries({ queryKey: ['driver_trips'] });
    },
  });
}

export function useStartTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startTrip,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', id] });
      qc.invalidateQueries({ queryKey: ['driver_trips'] });
    },
  });
}

export function useArriveAtStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, stopId }: { tripId: string; stopId: string }) =>
      arriveAtStop(tripId, stopId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', vars.tripId] });
    },
  });
}

export function useSubmitPickupReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      stopId,
      data,
    }: {
      tripId: string;
      stopId: string;
      data: any;
    }) => submitPickupReceipt(tripId, stopId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', vars.tripId] });
      qc.invalidateQueries({ queryKey: ['admin_trips'] });
    },
  });
}

export function useSubmitDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      stopId,
      data,
    }: {
      tripId: string;
      stopId: string;
      data: any;
    }) => submitDelivery(tripId, stopId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', vars.tripId] });
      qc.invalidateQueries({ queryKey: ['admin_trips'] });
    },
  });
}

export function useSkipStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      stopId,
      reason,
    }: {
      tripId: string;
      stopId: string;
      reason: string;
    }) => skipStop(tripId, stopId, { reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', vars.tripId] });
    },
  });
}

export function useReachedHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reachedHub,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', id] });
    },
  });
}

export function useReturnTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: returnTrip,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['driver_trip', id] });
    },
  });
}

export function useAssignTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignTrip,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_trips'] });
      qc.invalidateQueries({ queryKey: ['driver_trips'] });
    },
  });
}
