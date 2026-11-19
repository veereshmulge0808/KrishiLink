import React, { useState } from 'react';
import { getFarmersList } from '../../lib/api';
import { mockDb } from '../../lib/api/mock/db';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { UserCheck, Plus, Star, MapPin } from 'lucide-react';
import { FarmerProfile } from '../../types';

export const Farmers: React.FC = () => {
  const [farmers, setFarmers] = useState<FarmerProfile[]>(mockDb.farmers);
  const [editingFarmer, setEditingFarmer] = useState<FarmerProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: Column<FarmerProfile>[] = [
    {
      header: 'Farmer Name',
      cell: (f) => {
        const u = mockDb.users.find((u) => u.id === f.user_id);
        return (
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{u?.name || 'Farmer'}</p>
            <p className="text-[11px] text-slate-400 font-mono">{u?.phone}</p>
          </div>
        );
      },
      sortable: true,
    },
    {
      header: 'Village & Taluk',
      cell: (f) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{f.village}</p>
          <p className="text-[11px] text-slate-400">{f.taluk}, {f.district}</p>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Min Threshold',
      accessorKey: 'default_min_kg',
      cell: (f) => (
        <span className="font-black text-slate-900 dark:text-white">
          {f.default_min_kg} kg
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Reliability',
      accessorKey: 'reliability_score',
      cell: (f) => (
        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-xs">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>{f.reliability_score} / 5.0</span>
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Assigned Hub',
      cell: (f) => {
        const hub = mockDb.hubs.find((h) => h.id === f.nearest_hub_id);
        return <span className="text-xs font-semibold">{hub?.name || 'Mini Hub'}</span>;
      },
    },
    {
      header: 'Action',
      cell: (f) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingFarmer(f);
            setDialogOpen(true);
          }}
          className="text-xs font-bold"
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Smallholder Farmers Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verified Karnataka farmers in Kolar, Chikkaballapur, Doddaballapur & Hoskote clusters.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingFarmer(null);
            setDialogOpen(true);
          }}
          className="font-bold flex items-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Farmer</span>
        </Button>
      </div>

      <DataTable
        data={farmers}
        columns={columns}
        searchKey="village"
        searchPlaceholder="Search by village..."
        filename="farmers_directory.csv"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editingFarmer ? 'Edit Farmer Profile' : 'Onboard Farmer'}</DialogTitle>
          <DialogDescription>Configure farm location and minimum vehicle payload threshold.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-3 text-xs">
          <div>
            <label className="font-bold uppercase text-slate-500 block mb-1">Village & Taluk</label>
            <input
              type="text"
              defaultValue={editingFarmer?.village || 'Vemgal'}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="font-bold uppercase text-slate-500 block mb-1">Default Min Threshold (kg)</label>
            <input
              type="number"
              defaultValue={editingFarmer?.default_min_kg || 25}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-bold dark:bg-slate-800"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setDialogOpen(false)} className="font-bold">
            Save Farmer
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
