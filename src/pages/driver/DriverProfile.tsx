import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';
import {
  User,
  Phone,
  Truck,
  ShieldCheck,
  Building,
  Check,
  Edit3,
  LogOut,
  ArrowLeft,
  Navigation,
  FileText,
  AlertCircle,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';

export const DriverProfile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [driverName, setDriverName] = useState(user?.name || 'Suresh Kumar');
  const [phone, setPhone] = useState(user?.phone || '+91 98450 11223');
  const [vehicleModel, setVehicleModel] = useState('Tata Ace (Chota Hathi)');
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-AB-1234');
  const [payloadCapacity, setPayloadCapacity] = useState('1,000 kg');
  const [licenseNumber, setLicenseNumber] = useState('KA-01-2019-0048123');
  const [baseHub, setBaseHub] = useState('Kolar Village Mini Hub');
  const [isOnDuty, setIsOnDuty] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile Picture State (Base64 or preset emoji)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => localStorage.getItem('driver_avatar') || '');
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => localStorage.getItem('driver_avatar_emoji') || '🚚');

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarUrl(result);
        localStorage.setItem('driver_avatar', result);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl('');
    localStorage.removeItem('driver_avatar');
  };

  const selectEmoji = (emoji: string) => {
    setAvatarEmoji(emoji);
    localStorage.setItem('driver_avatar_emoji', emoji);
    setAvatarUrl('');
    localStorage.removeItem('driver_avatar');
  };

  const handleSave = () => {
    if (user) {
      setUser({
        ...user,
        name: driverName,
        phone: phone,
      });
    }
    setEditModalOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex flex-col gap-4">
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md animate-in slide-in-from-top">
          <Check className="h-4 w-4" />
          <span>Driver fleet profile updated successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Driver Profile
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Fleet credentials & vehicle telemetry</p>
        </div>

        <Button
          size="sm"
          onClick={() => setEditModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Edit</span>
        </Button>
      </div>

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* Driver Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
        {/* Avatar with Camera Action Button */}
        <div className="relative group shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-bold cursor-pointer overflow-hidden border-2 border-blue-500/30 hover:border-blue-600 transition-all shadow-inner"
            title="Click to upload profile photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={driverName} className="h-full w-full object-cover" />
            ) : (
              <span>{avatarEmoji}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-md transition-transform active:scale-95"
            aria-label="Upload Photo"
            title="Upload Photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="font-black text-lg text-slate-900 leading-tight truncate">
            {driverName}
          </h3>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-blue-600" />
            <span>{phone}</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span
              onClick={() => setIsOnDuty(!isOnDuty)}
              className={`cursor-pointer inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border transition-colors ${
                isOnDuty
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOnDuty ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{isOnDuty ? 'ON DUTY (Active)' : 'OFF DUTY'}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Verified Driver ✓
            </span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              <span>Upload Photo</span>
            </button>
            {avatarUrl && (
              <button
                onClick={removeAvatar}
                className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1 ml-2"
              >
                <Trash2 className="h-3 w-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle & Hub Details */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3.5 text-xs">
        <h4 className="font-extrabold uppercase tracking-wider text-slate-400 text-[11px] pb-1 border-b border-slate-100">
          Assigned Vehicle & Fleet Telemetry
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">Vehicle Model</span>
            <span className="font-black text-sm text-slate-900">{vehicleModel}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block">Registration Number</span>
            <span className="font-black text-sm text-blue-700 font-mono">{vehicleNumber}</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Gross Payload Capacity</span>
              <span className="font-extrabold text-slate-800">{payloadCapacity}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Commercial Driving License (DL)</span>
              <span className="font-mono font-bold text-slate-800">{licenseNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Building className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Base Village / City Hub</span>
              <span className="font-extrabold text-emerald-700">{baseHub}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Admin Dispatch Hotline:</span>
          <span className="font-bold text-slate-800">+91 80 2345 6789</span>
        </div>
      </div>

      {/* Account Actions */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-red-600 hover:bg-red-50 border-red-200 font-bold flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Switch Driver / Sign Out</span>
        </Button>
      </div>

      {/* Edit Driver Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogHeader>
          <DialogTitle>Edit Driver Fleet Profile</DialogTitle>
          <DialogDescription>Update driver contact and vehicle details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-3 text-xs">
          {/* Avatar Selector */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <span className="font-bold text-slate-700">Driver Profile Photo or Avatar</span>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl overflow-hidden shrink-0 border border-blue-400">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarEmoji}</span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold gap-1 py-1"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Choose Photo</span>
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={removeAvatar}
                      className="text-xs font-bold text-red-500 gap-1 py-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {['🚚', '👨‍✈️', '🚛', '🚗', '📦', '⚡'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => selectEmoji(emoji)}
                      className={`h-7 w-7 rounded-lg text-base flex items-center justify-center border transition-all ${
                        !avatarUrl && avatarEmoji === emoji
                          ? 'border-blue-600 bg-blue-100 scale-110'
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Driver Full Name *</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Phone Number *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Vehicle Reg No. *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Vehicle Model</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Payload Capacity</label>
              <input
                type="text"
                value={payloadCapacity}
                onChange={(e) => setPayloadCapacity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Driving License No.</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-semibold"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
            Save Details
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
