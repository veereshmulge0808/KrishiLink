import React from 'react';
import { Button } from '../ui/button';
import { Navigation, CheckCircle2, Warehouse, RotateCcw } from 'lucide-react';
import { TripStatus, StopStatus } from '../../types';

interface StatusStepperProps {
  tripStatus: TripStatus;
  currentStopStatus?: StopStatus;
  isLastStop?: boolean;
  onStartTrip: () => void;
  onArrive: () => void;
  onOpenReceipt: () => void;
  onNextStop: () => void;
  onReachedHub: () => void;
  onReturnTrip: () => void;
  className?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  tripStatus,
  currentStopStatus,
  isLastStop = false,
  onStartTrip,
  onArrive,
  onOpenReceipt,
  onNextStop,
  onReachedHub,
  onReturnTrip,
  className = '',
}) => {
  // If trip is ASSIGNED or ACKNOWLEDGED -> Primary button is "Start Trip"
  if (tripStatus === 'ASSIGNED' || tripStatus === 'ACKNOWLEDGED') {
    return (
      <Button
        onClick={onStartTrip}
        size="xl"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
      >
        <Navigation className="h-6 w-6" />
        <span>START TRIP (ಟ್ರಿಪ್ ಪ್ರಾರಂಭಿಸಿ)</span>
      </Button>
    );
  }

  // If trip is STARTED and currently at a stop
  if (tripStatus === 'STARTED') {
    if (currentStopStatus === 'PLANNED' || currentStopStatus === 'EN_ROUTE') {
      return (
        <Button
          onClick={onArrive}
          size="xl"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
        >
          <Navigation className="h-6 w-6" />
          <span>ARRIVED AT LOCATION (ಸ್ಥಳ ತಲುಪಿದ್ದೇನೆ)</span>
        </Button>
      );
    }

    if (currentStopStatus === 'ARRIVED') {
      return (
        <Button
          onClick={onOpenReceipt}
          size="xl"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-6 w-6" />
          <span>RECORD PRODUCE / RECEIPT (ಬೆಳೆ ದಾಖಲಿಸಿ)</span>
        </Button>
      );
    }

    if (currentStopStatus === 'COMPLETED') {
      if (!isLastStop) {
        return (
          <Button
            onClick={onNextStop}
            size="xl"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
          >
            <Navigation className="h-6 w-6" />
            <span>PROCEED TO NEXT STOP (ಮುಂದಿನ ನಿಲುಗಡೆ)</span>
          </Button>
        );
      } else {
        return (
          <Button
            onClick={onReachedHub}
            size="xl"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
          >
            <Warehouse className="h-6 w-6" />
            <span>REACHED HUB (ಹಬ್ ತಲುಪಲಾಗಿದೆ)</span>
          </Button>
        );
      }
    }
  }

  if (tripStatus === 'AT_HUB') {
    return (
      <Button
        onClick={onReturnTrip}
        size="xl"
        className="w-full bg-slate-900 hover:bg-black text-white font-black text-lg shadow-lg flex items-center justify-center gap-2 dark:bg-slate-100 dark:text-slate-900"
      >
        <RotateCcw className="h-6 w-6" />
        <span>RETURN TO BASE / CLOSE TRIP (ಮುಕ್ತಾಯ)</span>
      </Button>
    );
  }

  if (tripStatus === 'RETURNED' || tripStatus === 'CLOSED') {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
        ✅ Trip Completed & Returned (ಟ್ರಿಪ್ ಪೂರ್ಣಗೊಂಡಿದೆ)
      </div>
    );
  }

  return null;
};
