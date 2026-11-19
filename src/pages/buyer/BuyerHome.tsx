import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { useCrops } from '../../features/catalog/hooks';
import { CropGrid } from '../../components/crop/CropGrid';
import { OrganicToggle } from '../../components/crop/OrganicToggle';
import { useCartStore } from '../../stores/cartStore';
import { CardSkeleton } from '../../components/common/Skeletons';
import { ErrorState } from '../../components/common/ErrorState';
import { formatPaiseToRupees } from '../../lib/format';
import { useTranslation } from 'react-i18next';

export const BuyerHome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOrganicOnly, setIsOrganicOnly] = useState<boolean>(false);

  const { items, getItemCount, getTotalPaise } = useCartStore();
  const itemCount = getItemCount();
  const totalPaise = getTotalPaise();

  const { data: crops = [], isLoading, isError, refetch } = useCrops({
    query: search,
    category: selectedCategory,
    organic: isOrganicOnly ? true : undefined,
  });

  const categories = [
    { id: 'all', label: t('buyer.categories.all'), emoji: '🌱' },
    { id: 'fruit_veg', label: t('buyer.categories.fruit_veg'), emoji: '🍅' },
    { id: 'roots', label: t('buyer.categories.roots'), emoji: '🥔' },
    { id: 'leafy', label: t('buyer.categories.leafy'), emoji: '🥬' },
    { id: 'herbs', label: t('buyer.categories.herbs'), emoji: '🌿' },
  ];

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      {/* Delivery location pin banner */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span>{t('buyer.deliveryTo')}: <strong className="text-slate-900 dark:text-white">HSR Layout (City Hub)</strong></span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
          Next-Day 9 AM
        </span>
      </div>

      {/* Cutoff Banner */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold shadow-sm">
        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
        <span>{t('buyer.cutoffBanner')}</span>
      </div>

      {/* Sticky Search bar */}
      <div className="relative sticky top-14 z-20">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('buyer.searchPlaceholder')}
          className="w-full rounded-2xl border border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 outline-none shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:text-white"
        />
      </div>

      {/* Filter Chips & Organic Toggle */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-1">
        <div className="flex items-center gap-1.5 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <OrganicToggle
          isOrganicOnly={isOrganicOnly}
          onChange={setIsOrganicOnly}
          className="shrink-0"
        />
      </div>

      {/* Price locked note */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>{t('buyer.priceRangeNote')}</span>
        <span>Min order qty shown per crop</span>
      </div>

      {/* Crop Grid Catalog */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : crops.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-3xl mb-2">🔍</p>
          <p className="font-bold text-sm">No vegetables matched your search</p>
        </div>
      ) : (
        <CropGrid crops={crops} />
      )}

      {/* Sticky Bottom Cart Bar (Blinkit / Zepto style) */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom duration-200">
          <div
            onClick={() => navigate('/buyer/cart')}
            className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-emerald-600 text-white shadow-xl cursor-pointer hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            <div>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} in basket
              </p>
              <p className="text-base font-black">
                {formatPaiseToRupees(totalPaise.low)} – {formatPaiseToRupees(totalPaise.high)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-sm bg-white/20 px-3 py-1.5 rounded-xl">
              <span>{t('buyer.viewCart')}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
