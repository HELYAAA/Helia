import { useState } from 'react';
import { AdminPage } from '../components/AdminPage';
import { Game, Payment } from '../shared/types';
import { INITIAL_CATALOG } from '../shared/constants';
import { Toaster } from 'sonner@2.0.3';

export default function AdminApp() {
  const [catalog, setCatalog] = useState<Game[]>(INITIAL_CATALOG);
  const [payments, setPayments] = useState<Payment[]>([
    { id: "gcash", name: "GCash" },
    { id: "paymaya", name: "PayMaya" },
    { id: "grabpay", name: "GrabPay" },
  ]);
  const [siteSettings, setSiteSettings] = useState<{
    orderMethod: 'messenger' | 'place_order';
    banners: string[];
  }>({
    orderMethod: 'messenger',
    banners: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/20 to-purple-50/20">
      <Toaster position="top-center" duration={1500} />
      
      <AdminPage 
        currentCatalog={catalog}
        onUpdateCatalog={setCatalog}
        currentPayments={payments}
        onUpdatePayments={setPayments}
        siteSettings={siteSettings}
        onUpdateSettings={setSiteSettings}
        onLogout={() => {
          // For standalone admin app, just refresh or redirect to login
          window.location.reload();
        }}
      />
    </div>
  );
}
