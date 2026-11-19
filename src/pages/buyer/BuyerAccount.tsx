import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';
import {
  Store,
  CreditCard,
  ShieldCheck,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  Clock,
  Edit3,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPaiseToRupees } from '../../lib/format';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';

export const BuyerAccount: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Buyer profile state
  const [businessName, setBusinessName] = useState(user?.name || 'Udupi Upahar Veg Restaurant');
  const [contactPerson, setContactPerson] = useState('Kiran Kumar');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43201');
  const [email, setEmail] = useState('procurement@udupiupahar.in');
  const [businessType, setBusinessType] = useState('Pure Veg Restaurant & Catering');
  const [gstin, setGstin] = useState('29AAAAA1234A1Z5');
  const [fssai, setFssai] = useState('11223344556677');
  const [address, setAddress] = useState('14th Main, HSR Layout Sector 4, Bengaluru - 560102');
  const [preferredHub, setPreferredHub] = useState('HSR Layout City Micro Hub');
  const [preferredSlot, setPreferredSlot] = useState('7:00 AM – 8:00 AM');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = () => {
    if (user) {
      setUser({
        ...user,
        name: businessName,
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-5">
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md animate-in slide-in-from-top">
          <Check className="h-4 w-4" />
          <span>Buyer profile details updated successfully!</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('buyer.accountTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified wholesale buyer profile, tax registration, delivery preferences & credit line.
          </p>
        </div>

        <Button
          onClick={() => setEditModalOpen(true)}
          className="self-start font-bold text-xs bg-primary hover:bg-primary-700 flex items-center gap-1.5 shadow-sm"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Edit Business Profile</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: Profile & Detailed Info */}
        <div className="md:col-span-7 space-y-4">
          {/* Main Info Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center text-3xl font-bold shrink-0">
              🏨
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                {businessName}
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Contact: <strong className="text-slate-900 dark:text-white">{contactPerson}</strong>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  <span>Verified Wholesale Buyer ✓</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {businessType}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 text-xs">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
              Business & Regulatory Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Phone Number</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Email Address</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">GSTIN</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{gstin}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">FSSAI License</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{fssai}</span>
                </div>
              </div>
            </div>

            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              Delivery Logistics Location
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Default Receiving Address</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{address}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <Building className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Assigned Mini Hub</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{preferredHub}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Preferred Morning Slot</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{preferredSlot}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Credit Summary & Account Actions */}
        <div className="md:col-span-5 space-y-4">
          {/* Credit Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Wholesale Credit Line
              </span>
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block">{t('buyer.creditAvailable')}</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatPaiseToRupees(10750000)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">{t('buyer.creditLimit')}</span>
                <span className="text-sm font-bold text-slate-200">
                  {formatPaiseToRupees(15000000)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700 text-xs text-slate-400 flex justify-between">
              <span>Current Due: <strong>{formatPaiseToRupees(4250000)}</strong></span>
              <span className="text-slate-300">Term: <strong>7 Days Net</strong></span>
            </div>
          </div>

          {/* Sign Out Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full text-red-600 hover:bg-red-50 border-red-200 dark:border-red-900 dark:hover:bg-red-950 font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of Buyer Account</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogHeader>
          <DialogTitle>Edit Wholesale Buyer Profile</DialogTitle>
          <DialogDescription>
            Update your business details, tax credentials, and delivery preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-3 text-xs max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Business / Entity Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Phone Number *
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
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              >
                <option value="Pure Veg Restaurant & Catering">Restaurant & Catering</option>
                <option value="Cloud Kitchen Chain">Cloud Kitchen Chain</option>
                <option value="Hotel & Buffet">Hotel & Buffet</option>
                <option value="Hostel / College Mess">Hostel / College Mess</option>
                <option value="Supermarket / Retail">Supermarket / Retail</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                GSTIN
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-mono font-semibold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                FSSAI License
              </label>
              <input
                type="text"
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-mono font-semibold dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Delivery Address & Landmark
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Assigned City Hub
              </label>
              <select
                value={preferredHub}
                onChange={(e) => setPreferredHub(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              >
                <option value="HSR Layout City Micro Hub">HSR Layout City Micro Hub</option>
                <option value="Whitefield City Hub">Whitefield City Hub</option>
                <option value="Jayanagar City Hub">Jayanagar City Hub</option>
                <option value="Malleshwaram Hub">Malleshwaram Hub</option>
                <option value="Bengaluru Main Hub (Yeshwanthpur)">Bengaluru Main Hub (Yeshwanthpur)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Preferred Morning Slot
              </label>
              <select
                value={preferredSlot}
                onChange={(e) => setPreferredSlot(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              >
                <option value="5:30 AM – 6:30 AM">5:30 AM – 6:30 AM (Wholesale Prep)</option>
                <option value="6:30 AM – 7:30 AM">6:30 AM – 7:30 AM (Kitchen Shift)</option>
                <option value="7:00 AM – 8:00 AM">7:00 AM – 8:00 AM (Fastest Morning)</option>
                <option value="8:00 AM – 9:00 AM">8:00 AM – 9:00 AM (Popular for Cafes)</option>
                <option value="9:00 AM – 10:00 AM">9:00 AM – 10:00 AM (Caterer Shift)</option>
                <option value="11:00 AM – 12:30 PM">11:00 AM – 12:30 PM (Midday Restock)</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary-700 text-white font-bold">
            Save Profile
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
