import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crop } from '../../types';
import { CropIcon } from './CropIcon';
import { PriceRangeBadge } from './PriceRangeBadge';
import { QuantityStepper } from './QuantityStepper';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge';

interface CropCardProps {
  crop: Crop;
  quantityInCart: number;
  onQuantityChange: (qty: number) => void;
  className?: string;
}

export const CropCard: React.FC<CropCardProps> = ({
  crop,
  quantityInCart,
  onQuantityChange,
  className = '',
}) => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const isKn = i18n.language === 'kn';

  const availabilityBadge = {
    SUFFICIENT: { label: isKn ? 'ಲಭ್ಯವಿದೆ' : 'In Stock', variant: 'success' as const },
    LOW: { label: isKn ? 'ಕಡಿಮೆ ಇದೆ' : 'Limited', variant: 'warning' as const },
    OUT: { label: isKn ? 'ಖಾಲಿಯಾಗಿದೆ' : 'Out of Stock', variant: 'destructive' as const },
  }[crop.availability || 'SUFFICIENT'];

  return (
    <div
      onClick={() => navigate(`/buyer/crop/${crop.id}`)}
      className={`group relative flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer dark:bg-slate-900 dark:border-slate-800 ${className}`}
    >
      <div>
        {/* Badges bar */}
        <div className="flex items-center justify-between mb-2 gap-1">
          <Badge variant={availabilityBadge.variant} className="text-[10px] px-2 py-0.5">
            {availabilityBadge.label}
          </Badge>
          {crop.is_organic && (
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
              🌱 {t('buyer.organic')}
            </span>
          )}
        </div>

        {/* Icon & Name */}
        <div className="flex flex-col items-center py-2 text-center">
          <CropIcon emoji={crop.image_emoji} cropId={crop.id} size="lg" className="mb-2 group-hover:scale-105 transition-transform" />
          <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1 dark:text-white">
            {isKn ? crop.name_kn : crop.name_en}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {isKn ? crop.name_en : crop.name_kn}
          </p>
        </div>

        {/* Price & Min order */}
        <div className="mt-2 text-center">
          <PriceRangeBadge low={crop.price.low} high={crop.price.high} unit={crop.unit} />
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {t('buyer.minOrder', { min: crop.min_order_kg })}
          </p>
        </div>
      </div>

      {/* Stepper / Add button */}
      <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <QuantityStepper
          value={quantityInCart}
          min={crop.min_order_kg}
          step={5}
          unit={crop.unit}
          onChange={onQuantityChange}
        />
      </div>
    </div>
  );
};
