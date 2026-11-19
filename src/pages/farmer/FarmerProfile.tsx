import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useFarmerThreshold } from '../../features/listings/hooks';
import { Button } from '../../components/ui/button';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Scale,
  CreditCard,
  Edit3,
  Check,
  ShieldCheck,
  Sprout,
  ArrowLeft,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';

export const FarmerProfile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [farmerName, setFarmerName] = useState(user?.name || 'Ramesh Gowda (ರಾಮೇಶ್ ಗೌಡ)');
  const [phone, setPhone] = useState(user?.phone || '+91 98451 23456');
  const [email, setEmail] = useState(''); // Optional!
  const [village, setVillage] = useState('Vemgal');
  const [taluk, setTaluk] = useState('Kolar');
  const [district, setDistrict] = useState('Kolar');
  const [farmAddress, setFarmAddress] = useState('Survey No. 42/B, Near Vemgal Cross Road, Kolar');
  const [assignedHub, setAssignedHub] = useState('Kolar Village Mini Hub');
  const [landAcres, setLandAcres] = useState(3.5);
  const [minThresholdKg, setMinThresholdKg] = useState(25);
  const [upiId, setUpiId] = useState('9845123456@sbi');
  const [primaryCrops, setPrimaryCrops] = useState('Tomato, French Beans, Green Chilli');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile Picture State (Base64 or preset emoji)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => localStorage.getItem('farmer_avatar') || '');
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => localStorage.getItem('farmer_avatar_emoji') || '👨‍🌾');

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(isKn ? 'ಚಿತ್ರದ ಗಾತ್ರ 5MB ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು' : 'Image size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarUrl(result);
        localStorage.setItem('farmer_avatar', result);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl('');
    localStorage.removeItem('farmer_avatar');
  };

  const selectEmoji = (emoji: string) => {
    setAvatarEmoji(emoji);
    localStorage.setItem('farmer_avatar_emoji', emoji);
    setAvatarUrl('');
    localStorage.removeItem('farmer_avatar');
  };

  const handleSave = () => {
    if (user) {
      setUser({
        ...user,
        name: farmerName,
        phone: phone,
      });
    }
    setEditModalOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md animate-in slide-in-from-top">
          <Check className="h-4 w-4" />
          <span>
            {isKn ? 'ರೈತರ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲ್ಪಟ್ಟಿವೆ!' : 'Farmer profile updated successfully!'}
          </span>
        </div>
      )}

      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/farmer')}
          className="p-1 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isKn ? 'ಹಿಂದಕ್ಕೆ' : 'Back to Today'}</span>
        </button>

        <Button
          size="sm"
          onClick={() => setEditModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>{isKn ? 'ವಿವರ ತಿದ್ದುಪಡಿ' : 'Edit Profile'}</span>
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

      {/* Profile Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
        {/* Avatar with Camera Action Button */}
        <div className="relative group shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center text-3xl font-bold cursor-pointer overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-600 transition-all shadow-inner"
            title={isKn ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click to upload photo'}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={farmerName} className="h-full w-full object-cover" />
            ) : (
              <span>{avatarEmoji}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-full shadow-md transition-transform active:scale-95"
            aria-label="Upload Photo"
            title="Upload Photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight truncate">
              {farmerName}
            </h3>
          </div>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-emerald-600" />
            <span>{phone}</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>{isKn ? 'ಪರಿಶೀಲಿತ ರೈತರು ✓' : 'Verified Farmer ✓'}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {landAcres} {isKn ? 'ಎಕರೆ' : 'Acres'}
            </span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              <span>{isKn ? 'ಫೋಟೋ ಬದಲಾಯಿಸಿ' : 'Upload Photo'}</span>
            </button>
            {avatarUrl && (
              <button
                onClick={removeAvatar}
                className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1 ml-2"
              >
                <Trash2 className="h-3 w-3" />
                <span>{isKn ? 'ತೆಗೆದುಹಾಕಿ' : 'Remove'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details List */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 text-xs">
        <h4 className="font-extrabold uppercase tracking-wider text-slate-400 text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
          {isKn ? 'ತೋಟ ಮತ್ತು ವಿಳಾಸದ ಮಾಹಿತಿ' : 'Farm & Location Details'}
        </h4>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                {isKn ? 'ಗ್ರಾಮ & ತಾಲೂಕು' : 'Village & Taluk'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {village}, {taluk} ({district})
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                {isKn ? 'ತೋಟದ ವಿಳಾಸ / ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್' : 'Farm Survey Address / Landmark'}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                {farmAddress}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Building className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                {isKn ? 'ನಿಯೋಜಿತ ಮಿನಿ ಹಬ್' : 'Assigned Village Mini Hub'}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {assignedHub}
              </span>
            </div>
          </div>
        </div>

        <h4 className="font-extrabold uppercase tracking-wider text-slate-400 text-[11px] pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          {isKn ? 'ಬೆಳೆ ಮತ್ತು ಪಾವತಿ ವಿವರಗಳು' : 'Produce & Payout Details'}
        </h4>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Sprout className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                {isKn ? 'ಮುಖ್ಯ ಬೆಳೆಗಳು' : 'Primary Harvest Crops'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {primaryCrops}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Scale className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                {isKn ? 'ಕನಿಷ್ಠ ಪಿಕಪ್ ತೂಕ (ಥ್ರೆಶೋಲ್ಡ್)' : 'Min Pickup Threshold'}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {minThresholdKg} kg
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                {isKn ? 'ನೇರ ಪಾವತಿ UPI / ಬ್ಯಾಂಕ್' : 'Direct Payout UPI ID'}
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {upiId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">
                {isKn ? 'ಇಮೇಲ್ (ಐಚ್ಛಿಕ)' : 'Email (Optional)'}
              </span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {email || (isKn ? 'ನಮೂದಿಸಿಲ್ಲ (ಐಚ್ಛಿಕ)' : 'Not provided (Optional)')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogHeader>
          <DialogTitle>{isKn ? 'ರೈತರ ಮಾಹಿತಿ ಬದಲಾವಣೆ' : 'Edit Farmer Profile'}</DialogTitle>
          <DialogDescription>
            {isKn ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮತ್ತು ತೋಟದ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ.' : 'Update your personal and farm details.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
          {/* Avatar Selector in Dialog */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {isKn ? 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಅಥವಾ ಅವತಾರ್' : 'Profile Picture or Avatar'}
            </span>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-2xl overflow-hidden shrink-0 border border-emerald-500/40">
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
                    <span>{isKn ? 'ಫೋಟೋ ಆರಿಸಿ' : 'Choose Photo'}</span>
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
                      <span>{isKn ? 'ತೆಗೆಯಿರಿ' : 'Remove'}</span>
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {['👨‍🌾', '👩‍🌾', '🌾', '🚜', '🌱', '🍅'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => selectEmoji(emoji)}
                      className={`h-7 w-7 rounded-lg text-base flex items-center justify-center border transition-all ${
                        !avatarUrl && avatarEmoji === emoji
                          ? 'border-emerald-600 bg-emerald-100 scale-110'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100'
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
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              {isKn ? 'ರೈತರ ಪೂರ್ಣ ಹೆಸರು *' : 'Farmer Full Name *'}
            </label>
            <input
              type="text"
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isKn ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *' : 'Phone Number *'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isKn ? 'ಇಮೇಲ್ (ಐಚ್ಛಿಕ)' : 'Email (Optional)'}
              </label>
              <input
                type="email"
                placeholder={isKn ? 'ಐಚ್ಛಿಕ' : 'Optional'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isKn ? 'ಗ್ರಾಮ *' : 'Village *'}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isKn ? 'ತಾಲೂಕು *' : 'Taluk *'}
              </label>
              <input
                type="text"
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              {isKn ? 'ತೋಟದ ವಿಳಾಸ & ಸರ್ವೇ ನಂ' : 'Farm Address & Survey No.'}
            </label>
            <textarea
              rows={2}
              value={farmAddress}
              onChange={(e) => setFarmAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isKn ? 'ತೋಟದ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)' : 'Landholding (Acres)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={landAcres}
                onChange={(e) => setLandAcres(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isKn ? 'ಕನಿಷ್ಠ ಥ್ರೆಶೋಲ್ಡ್ (ಕೆಜಿ)' : 'Default Threshold (kg)'}
              </label>
              <input
                type="number"
                value={minThresholdKg}
                onChange={(e) => setMinThresholdKg(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              {isKn ? 'ನೇರ ಪಾವತಿ UPI ID' : 'Direct Payout UPI ID'}
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-mono font-semibold dark:bg-slate-800"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            {isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            {isKn ? 'ಉಳಿಸಿ' : 'Save Details'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
