import React from 'react';
import { Crop } from '../../types';
import { CropCard } from './CropCard';
import { useCartStore } from '../../stores/cartStore';

interface CropGridProps {
  crops: Crop[];
  className?: string;
}

export const CropGrid: React.FC<CropGridProps> = ({ crops, className = '' }) => {
  const { items, addItem, updateQty } = useCartStore();

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 ${className}`}
    >
      {crops.map((crop) => {
        const inCartQty = items[crop.id]?.qty_kg || 0;
        return (
          <CropCard
            key={crop.id}
            crop={crop}
            quantityInCart={inCartQty}
            onQuantityChange={(qty) => {
              if (qty === 0) {
                updateQty(crop.id, 0);
              } else if (inCartQty === 0) {
                addItem(crop, qty);
              } else {
                updateQty(crop.id, qty);
              }
            }}
          />
        );
      })}
    </div>
  );
};
