import React from 'react';
import { TripStatus } from '../../types';
import { TRIP_STATUS_LABELS } from '../../lib/constants';

interface TripStatusPillProps {
  status: TripStatus;
  className?: string;
}

export const TripStatusPill: React.FC<TripStatusPillProps> = ({ status, className = '' }) => {
  const styles: Record<TripStatus, string> = {
    ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
    ACKNOWLEDGED: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300',
    STARTED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 font-bold animate-pulse',
    AT_HUB: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
    RETURNED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
    INCIDENT: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        styles[status] || styles.ASSIGNED
      } ${className}`}
    >
      {TRIP_STATUS_LABELS[status] || status}
    </span>
  );
};
