import { useQuery } from '@tanstack/react-query';
import { getOrderTracking, requestMaskedCall } from '../../lib/api';

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: ['tracking', orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId,
    refetchInterval: 3000,
  });
}

export async function triggerMaskedCall(data: {
  order_id?: string;
  trip_id?: string;
  target: 'driver' | 'farmer' | 'buyer' | 'ops';
}) {
  return requestMaskedCall(data);
}
