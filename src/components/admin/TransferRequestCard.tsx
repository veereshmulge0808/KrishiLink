import React from 'react';
import { TransferRequest } from '../../types';
import { ArrowRight, Check, X, Truck } from 'lucide-react';
import { Button } from '../ui/button';
import { CropIcon } from '../crop/CropIcon';
import { useTranslation } from 'react-i18next';

interface TransferRequestCardProps {
  transfer: TransferRequest;
  onApprove?: (id: string) => void;
  onAssignDriver?: (id: string) => void;
  onReject?: (id: string) => void;
  onReceive?: (id: string) => void;
  className?: string;
}

export const TransferRequestCard: React.FC<TransferRequestCardProps> = ({
  transfer,
  onApprove,
  onAssignDriver,
  onReject,
  onReceive,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const urgencyStyles = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    NORMAL: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    LOW: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  }[transfer.urgency];

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition-all dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CropIcon emoji={transfer.crop?.image_emoji} size="sm" />
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              {isKn ? transfer.crop?.name_kn : transfer.crop?.name_en}
            </h4>
            <span className="text-xs text-primary font-black">
              {transfer.requested_kg.toLocaleString()} kg
            </span>
          </div>
        </div>
        <span
          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${urgencyStyles}`}
        >
          {transfer.urgency}
        </span>
      </div>

      {/* Movement Details */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span className="font-semibold line-clamp-1">{transfer.from_hub?.name}</span>
          <ArrowRight className="h-3 w-3 shrink-0 mx-1 text-slate-400" />
          <span className="font-bold line-clamp-1 text-slate-900 dark:text-white">
            {transfer.to_hub?.name}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{transfer.distance_km} km</span>
          <span>~{transfer.eta_hours}h transit</span>
        </div>
      </div>

      {/* Action Buttons based on state */}
      <div className="mt-3.5 flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {transfer.status === 'REQUESTED' && (
          <>
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(transfer.id)}
                className="text-xs h-8 text-red-600 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            )}
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(transfer.id)}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
            )}
          </>
        )}

        {transfer.status === 'APPROVED' && onAssignDriver && (
          <Button
            size="sm"
            onClick={() => onAssignDriver(transfer.id)}
            className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1"
          >
            <Truck className="h-3.5 w-3.5" />
            Assign Transfer Trip
          </Button>
        )}

        {transfer.status === 'IN_TRANSIT' && onReceive && (
          <Button
            size="sm"
            onClick={() => onReceive(transfer.id)}
            className="w-full text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
            Confirm Received at Hub
          </Button>
        )}
      </div>
    </div>
  );
};
