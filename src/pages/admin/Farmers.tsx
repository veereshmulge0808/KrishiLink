import React, { useState } from 'react';
import { getFarmersList } from '../../lib/api';
import { mockDb } from '../../lib/api/mock/db';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { UserCheck, Plus, Star, MapPin, Check, Phone, Building } from 'lucide-react';
import { FarmerProfile } from '../../types';

export const Farmers: React.FC = () => {
  const [farmers, setFarmers] = useState<FarmerProfile[]>(mockDb.farmers);
  const [editingFarmer, setEditingFarmer] = useState<FarmerProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98');
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('');
  const [taluk, setTaluk] = useState('Kolar');
  const [district, setDistrict] = useState('Kolar');
  const [farmAddress, setFarmAddress] = useState('');
  const [nearestHubId, setNearestHubId] = useState('hub_v_kolar');
  const [minKg, setMinKg] = useState(25);
  const [landAcres, setLandAcres] = useState(3.0);
  const [upiId, setUpiId] = useState('');
  const [cropsSelected, setCropsSelected] = useState<string[]>(['Tomato', 'Onion']);

  const availableCrops = ['Tomato', 'Onion', 'Potato', 'Carrot', 'French Beans', 'Cabbage', 'Cauliflower', 'Green Chilli'];

  const handleOpenOnboard = (farmer?: FarmerProfile) => {
    if (farmer) {
      setEditingFarmer(farmer);
      const u = mockDb.users.find((u) => u.id === farmer.user_id);
      setName(u?.name || 'Farmer');
      setPhone(u?.phone || '+91 98451 00000');
      setEmail('');
      setVillage(farmer.village);
      setTaluk(farmer.taluk);
      setDistrict(farmer.district);
      setFarmAddress(farmer.address || `${farmer.village}, ${farmer.taluk}`);
      setNearestHubId(farmer.nearest_hub_id);
      setMinKg(farmer.default_min_kg);
      setLandAcres(farmer.land_acres || 3.0);
      setUpiId(`${farmer.user_id}@upi`);
    } else {
      setEditingFarmer(null);
      setName('');
      setPhone('+91 98');
      setEmail('');
      setVillage('');
      setTaluk('Kolar');
      setDistrict('Kolar');
      setFarmAddress('');
      setNearestHubId('hub_v_kolar');
      setMinKg(25);
      setLandAcres(3.0);
      setUpiId('');
      setCropsSelected(['Tomato', 'Onion']);
    }
    setDialogOpen(true);
  };

  const handleSaveFarmer = () => {
    if (!name.trim() || !village.trim()) return;

    if (editingFarmer) {
      // Update
      const updatedFarmers = farmers.map((f) => {
        if (f.user_id === editingFarmer.user_id) {
          return {
            ...f,
            village,
            taluk,
            district,
            address: farmAddress,
            nearest_hub_id: nearestHubId,
            default_min_kg: minKg,
            land_acres: landAcres,
          };
        }
        return f;
      });
      setFarmers(updatedFarmers);
      setSuccessMsg(`Farmer ${name} updated successfully!`);
    } else {
      // Create new
      const newUserId = `u_farmer_${Date.now()}`;
      const newFarmerId = `farmer_${Date.now()}`;
      
      const newUser = {
        id: newUserId,
        phone: phone.trim() || '+91 98451 99999',
        name: name.trim(),
        role: 'farmer' as const,
        language: 'kn' as const,
      };
      mockDb.users.push(newUser);

      const newFarmer: FarmerProfile = {
        id: newFarmerId,
        user_id: newUserId,
        village: village.trim(),
        taluk: taluk.trim(),
        district: district.trim(),
        address: farmAddress.trim() || `${village}, ${taluk}`,
        nearest_hub_id: nearestHubId,
        default_min_kg: minKg,
        reliability_score: 5.0,
        land_acres: landAcres,
      };
      mockDb.farmers.push(newFarmer);
      setFarmers([newFarmer, ...farmers]);
      setSuccessMsg(`New farmer ${name} onboarded successfully!`);
    }

    setDialogOpen(false);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

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
          <span>{f.reliability_score || 4.9} / 5.0</span>
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Assigned Hub',
      cell: (f) => {
        const hub = mockDb.hubs.find((h) => h.id === f.nearest_hub_id);
        return <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{hub?.name || 'Mini Hub'}</span>;
      },
    },
    {
      header: 'Action',
      cell: (f) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenOnboard(f)}
          className="text-xs font-bold"
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md animate-in slide-in-from-top">
          <Check className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

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
          onClick={() => handleOpenOnboard()}
          className="font-bold bg-primary hover:bg-primary-700 text-white flex items-center gap-1.5 self-start shadow-sm"
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

      {/* Comprehensive Onboard Farmer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editingFarmer ? 'Edit Farmer Profile' : 'Onboard New Smallholder Farmer'}</DialogTitle>
          <DialogDescription>
            Enter complete farmer identification, farm coordinates, crops, and vehicle payload threshold.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-3 text-xs max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Farmer Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Gowda (ರಾಮೇಶ್ ಗೌಡ)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="text"
                placeholder="+91 98451 23456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Village / Grama *
              </label>
              <input
                type="text"
                placeholder="e.g. Vemgal"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Taluk *
              </label>
              <input
                type="text"
                placeholder="e.g. Kolar"
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                District
              </label>
              <input
                type="text"
                placeholder="Kolar / Chikkaballapur"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Detailed Farm Address / Survey Landmark
            </label>
            <input
              type="text"
              placeholder="e.g. Survey #42/B, Near Vemgal Cross Road, Kolar Rural"
              value={farmAddress}
              onChange={(e) => setFarmAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Assigned Mini Hub *
              </label>
              <select
                value={nearestHubId}
                onChange={(e) => setNearestHubId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              >
                <option value="hub_v_kolar">Kolar Village Mini Hub</option>
                <option value="hub_v_chikkaballapur">Chikkaballapur Village Hub</option>
                <option value="hub_v_doddaballapur">Doddaballapur Village Hub</option>
                <option value="hub_v_hoskote">Hoskote Village Mini Hub</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Default Min Threshold (kg) *
              </label>
              <input
                type="number"
                value={minKg}
                onChange={(e) => setMinKg(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Land Size (Acres)
              </label>
              <input
                type="number"
                step="0.5"
                value={landAcres}
                onChange={(e) => setLandAcres(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="Optional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Bank A/C or UPI ID (For Direct Payouts)
              </label>
              <input
                type="text"
                placeholder="e.g. ramesh@sbi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-mono font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Primary Crops Harvested
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableCrops.map((cropName) => {
                const isSelected = cropsSelected.includes(cropName);
                return (
                  <button
                    key={cropName}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCropsSelected(cropsSelected.filter((c) => c !== cropName));
                      } else {
                        setCropsSelected([...cropsSelected, cropName]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {cropName} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveFarmer}
            disabled={!name.trim() || !village.trim()}
            className="bg-primary hover:bg-primary-700 text-white font-bold"
          >
            {editingFarmer ? 'Update Farmer' : 'Save & Onboard Farmer'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
