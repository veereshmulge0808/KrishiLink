import React from 'react';
import { AlertItem } from '../../types';
import { AlertTriangle, Clock, TrendingDown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTimeOnly } from '../../lib/format';

interface AlertsFeedProps {
  alerts: AlertItem[];
  className?: string;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts, className = '' }) => {
  const navigate = useNavigate();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'DELAY':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'STOCK_OUT':
      case 'STOCK_LOW':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                {getAlertIcon(alert.type)}
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getSeverityBadge(
                  alert.severity
                )}`}
              >
                {alert.severity}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {formatTimeOnly(alert.timestamp)}
            </span>
          </div>

          <h5 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            {alert.title}
          </h5>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {alert.message}
          </p>

          {alert.action_label && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => alert.action_route && navigate(alert.action_route)}
                className="text-xs font-bold text-primary hover:text-primary-700 flex items-center gap-1"
              >
                <span>{alert.action_label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
