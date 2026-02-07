import { useState, useEffect } from 'react';
import { Game, Product, Payment } from '../shared/types';
import { projectId, publicAnonKey } from '../shared/supabase-info';
import { toast } from 'sonner@2.0.3';
import { LayoutDashboard, ShoppingBag, Save, Plus, Trash, LogOut, TrendingUp, Calendar, CreditCard, Menu, X, Settings, Upload, Image as ImageIcon, Eye, MoreHorizontal, Copy, Edit, Check, CheckCircle, XCircle, Clock, List, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Defs, LinearGradient, Stop } from 'recharts';

interface AdminPageProps {
  onLogout: () => void;
  currentCatalog: Game[];
  onUpdateCatalog: (newCatalog: Game[]) => void;
  currentPayments: Payment[];
  onUpdatePayments: (newPayments: Payment[]) => void;
  siteSettings: {
    orderMethod: 'messenger' | 'place_order';
    banners: string[];
  };
  onUpdateSettings: (newSettings: { orderMethod: 'messenger' | 'place_order'; banners: string[] }) => void;
}

export function AdminPage({ onLogout, currentCatalog, onUpdateCatalog, currentPayments, onUpdatePayments, siteSettings, onUpdateSettings }: AdminPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'payments' | 'settings'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Payment State
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [tempPayment, setTempPayment] = useState<Partial<Payment>>({});

  // Order Management State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'messenger' | 'place_order'>('all');

  // Sales Stats
  const [dailySales, setDailySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Password Change State
  const [adminPassword, setAdminPassword] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('helia_admin_password');
    return saved || 'admin123'; // Default password if not set
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Sync editingGame with currentCatalog when catalog changes
  useEffect(() => {
    if (editingGame) {
      const updatedGame = currentCatalog.find(g => g.id === editingGame.id);
      if (updatedGame) {
        setEditingGame(updatedGame);
      }
    }
  }, [currentCatalog]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      // Poll every 5 seconds for real-time updates
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
     if (orders.length > 0) {
        calculateStats(orders);
     }
  }, [selectedMonth, orders]);

  const getStatusLabel = (status: string) => {
    if (!status || status === 'pending') return 'Processing';
    if (status === 'approved') return 'Completed';
    if (status === 'rejected') return 'Rejected';
    return status;
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/orders`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      const data = await response.json();
      if (data.orders) {
        setOrders(data.orders);
        calculateStats(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
      toast.error('Failed to load sales data');
    }
  };

  const calculateStats = (ordersList: any[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Use selected month or current month
    const targetMonth = selectedMonth || now.toISOString().slice(0, 7);

    let dayTotal = 0;
    let monthTotal = 0;
    
    // Group by date for chart
    const salesByDate: Record<string, number> = {};

    ordersList.forEach(order => {
      // Parse timestamp
      const date = order.timestamp ? new Date(order.timestamp) : new Date();
      const dateStr = date.toISOString().split('T')[0];
      const monthStr = date.toISOString().slice(0, 7);
      
      const amount = (order.status === 'approved' && order.totalAmount) ? order.totalAmount : 0;

      if (dateStr === today) dayTotal += amount;
      if (monthStr === targetMonth) monthTotal += amount;

      salesByDate[dateStr] = (salesByDate[dateStr] || 0) + amount;
    });

    setDailySales(dayTotal);
    setMonthlySales(monthTotal);

    const chartData = Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days
    
    setSalesData(chartData);
  };

  const handleUpdateGameDetails = (gameId: string, updates: Partial<Game>) => {
    const newCatalog = currentCatalog.map(game => 
      game.id === gameId ? { ...game, ...updates } : game
    );
    onUpdateCatalog(newCatalog);
  };

  const handleUploadGameImage = async (gameId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const loadingToast = toast.loading('Uploading game image...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/upload-banner`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData,
      });

      toast.dismiss(loadingToast);

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      handleUpdateGameDetails(gameId, { image: url });
      toast.success('Image updated');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleSaveCatalog = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/catalog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ catalog: currentCatalog }),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Catalog saved successfully');
    } catch (error) {
      toast.error('Failed to save catalog');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payments: currentPayments }),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Payments saved successfully');
    } catch (error) {
      toast.error('Failed to save payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProductPrice = (gameId: string, productId: string, newPrice: number) => {
    const newCatalog = currentCatalog.map(game => {
      if (game.id !== gameId) return game;
      return {
        ...game,
        products: game.products.map(p => {
          if (p.id !== productId) return p;
          return { ...p, price: newPrice };
        })
      };
    });
    onUpdateCatalog(newCatalog);
  };

  const handleUpdateProductName = (gameId: string, productId: string, newName: string) => {
    const newCatalog = currentCatalog.map(game => {
      if (game.id !== gameId) return game;
      return {
        ...game,
        products: game.products.map(p => {
          if (p.id !== productId) return p;
          return { ...p, name: newName };
        })
      };
    });
    onUpdateCatalog(newCatalog);
  };

  const handleAddProduct = (gameId: string) => {
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: 'New Product',
      price: 0,
    };
    
    const newCatalog = currentCatalog.map(game => {
      if (game.id !== gameId) return game;
      return {
        ...game,
        products: [...game.products, newProduct]
      };
    });
    onUpdateCatalog(newCatalog);
    toast.success('Product added');
  };

  const handleDeleteProduct = (gameId: string, productId: string) => {
    if (!confirm('Delete this product?')) return;
    
    const newCatalog = currentCatalog.map(game => {
      if (game.id !== gameId) return game;
      return {
        ...game,
        products: game.products.filter(p => p.id !== productId)
      };
    });
    onUpdateCatalog(newCatalog);
    toast.success('Product deleted');
  };

  const handleMoveProductUp = (gameId: string, productIndex: number) => {
    if (productIndex === 0) return; // Already at top
    
    const newCatalog = currentCatalog.map(game => {
      if (game.id !== gameId) return game;
      const newProducts = [...game.products];
      // Swap with previous item
      [newProducts[productIndex - 1], newProducts[productIndex]] = [newProducts[productIndex], newProducts[productIndex - 1]];
      return {
        ...game,
        products: newProducts
      };
    });
    onUpdateCatalog(newCatalog);
  };

  const handleMoveProductDown = (gameId: string, productIndex: number) => {
    const game = currentCatalog.find(g => g.id === gameId);
    if (!game || productIndex === game.products.length - 1) return; // Already at bottom
    
    const newCatalog = currentCatalog.map(g => {
      if (g.id !== gameId) return g;
      const newProducts = [...g.products];
      // Swap with next item
      [newProducts[productIndex], newProducts[productIndex + 1]] = [newProducts[productIndex + 1], newProducts[productIndex]];
      return {
        ...g,
        products: newProducts
      };
    });
    onUpdateCatalog(newCatalog);
  };

  const handleSavePayment = () => {
    if (!tempPayment.name) {
       toast.error("Payment name is required");
       return;
    }
    
    let newPayments = [...currentPayments];
    
    if (editingPayment) {
        // Edit existing
        newPayments = newPayments.map(p => p.id === editingPayment.id ? { ...p, ...tempPayment } as Payment : p);
        toast.success("Payment method updated");
    } else {
        // Add new
        const newId = tempPayment.name.toLowerCase().replace(/\s+/g, '') + Date.now().toString().slice(-4);
        newPayments.push({ ...tempPayment, id: newId } as Payment);
        toast.success("Payment method added");
    }
    
    onUpdatePayments(newPayments);
    setEditingPayment(null);
    setIsAddingPayment(false);
    setTempPayment({});
  };

  const handleDeletePayment = (id: string) => {
    if (window.confirm("Are you sure you want to delete this payment method?")) {
      onUpdatePayments(currentPayments.filter(p => p.id !== id));
      toast.success('Payment method removed');
    }
  };

  const handleUpdateOrder = async (orderId: string, status: string, notes?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status, notes } : o));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status, notes });
      }

      toast.success(`Order ${status}`);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Update order error', error);
      toast.error('Failed to update order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: siteSettings }),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadBanner = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    if (siteSettings.banners.length >= 5) {
        toast.error('Maximum 5 banners allowed');
        return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const loadingToast = toast.loading('Uploading banner...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/upload-banner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      
      const newBanners = [...siteSettings.banners, url];
      onUpdateSettings({ ...siteSettings, banners: newBanners });
      toast.success('Banner uploaded');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload banner');
    }
  };

  const handleRemoveBanner = (index: number) => {
    const newBanners = siteSettings.banners.filter((_, i) => i !== index);
    onUpdateSettings({ ...siteSettings, banners: newBanners });
  };

  const handleClearOrders = async () => {
    if (!window.confirm("Are you sure you want to delete ALL orders? This action cannot be undone.")) {
      return;
    }

    if (!window.confirm("Please confirm again. This will permanently remove all order history.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/orders`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete orders');

      const data = await response.json();
      toast.success(`Successfully deleted ${data.count} orders`);
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error('Delete orders error:', error);
      toast.error('Failed to delete orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (currentPassword !== adminPassword) {
      toast.error('Current password is incorrect');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      // Save to localStorage
      localStorage.setItem('helia_admin_password', newPassword);
      setAdminPassword(newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    }
  };



  const handleUploadPaymentLogo = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const loadingToast = toast.loading('Uploading logo...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/upload-banner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setTempPayment(prev => ({ ...prev, logo: url }));
      toast.success('Logo uploaded');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    }
  };

  const handleUploadPaymentQR = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const loadingToast = toast.loading('Uploading QR...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-245feaad/upload-banner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setTempPayment(prev => ({ ...prev, qrCode: url }));
      toast.success('QR Code uploaded');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload QR');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-pink-100/50">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-pink-200">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Helia Admin</h2>
            <p className="text-gray-500 text-sm mt-2">Secure Dashboard Access</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === adminPassword) { 
              setIsAuthenticated(true);
              toast.success('Welcome back, Admin!');
            } else {
              toast.error('Invalid password');
            }
          }}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:shadow-xl hover:shadow-pink-200/50 hover:scale-[1.02] transition-all duration-200"
            >
              Access Dashboard
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full mt-3 text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
            >
              Back to Shop
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/20 to-purple-50/20 flex flex-col md:flex-row relative">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-xl p-4 border-b border-pink-100/50 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          Helia Admin
        </h2>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-pink-50 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-xl border-r border-pink-100/50 p-6 flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-auto md:flex
      `}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Helia Admin
            </h2>
            <p className="text-xs text-gray-500 mt-1">Management Dashboard</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:bg-gray-100 rounded-full p-1">
            <X size={24} />
          </button>
        </div>
        
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-200/50' 
                : 'text-gray-600 hover:bg-pink-50/50'
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab('orders');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'orders' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-200/50' 
                : 'text-gray-600 hover:bg-pink-50/50'
            }`}
          >
            <List size={20} />
            Orders
          </button>
          <button
            onClick={() => {
              setActiveTab('products');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'products' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-200/50' 
                : 'text-gray-600 hover:bg-pink-50/50'
            }`}
          >
            <ShoppingBag size={20} />
            Products
          </button>
          <button
            onClick={() => {
              setActiveTab('payments');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'payments' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-200/50' 
                : 'text-gray-600 hover:bg-pink-50/50'
            }`}
          >
            <CreditCard size={20} />
            Payments
          </button>
          <button
            onClick={() => {
              setActiveTab('settings');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-200/50' 
                : 'text-gray-600 hover:bg-pink-50/50'
            }`}
          >
            <Settings size={20} />
            Settings
          </button>
        </nav>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors mt-auto font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sales Overview</h1>
              <p className="text-gray-500 mt-1">Track your performance and revenue</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-pink-100/50 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold">Daily Sales (Today)</h3>
                  <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl shadow-lg shadow-green-200/50">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₱{dailySales.toFixed(2)}</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-pink-100/50 hover:shadow-xl transition-shadow relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold">Monthly Sales</h3>
                  <div className="relative">
                    <button 
                      onClick={() => setShowMonthPicker(!showMonthPicker)}
                      className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-200/50 hover:scale-105 transition-transform"
                    >
                      <Calendar size={20} />
                    </button>
                    
                    {showMonthPicker && (
                      <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-pink-100 rounded-xl shadow-2xl p-3 z-10 w-48">
                         <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Select Month</div>
                         <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => {
                               setSelectedMonth(e.target.value);
                               setShowMonthPicker(false);
                            }}
                            className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                         />
                         <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-center text-gray-400">
                            Showing: {new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">₱{monthlySales.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-2">
                   For {new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-pink-100/50">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Sales Trend (Last 7 Days)</h3>
              {salesData.length > 0 ? (
              <div className="w-full" style={{ height: '256px', minHeight: '256px', width: '100%' }}>
                <ResponsiveContainer width="100%" height={256}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid #fbcfe8',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 8, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <div className="w-full flex items-center justify-center text-gray-400 text-sm" style={{ height: '256px' }}>
                  No sales data available
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-pink-100/50 overflow-hidden">
              <div className="p-6 border-b border-pink-100/50 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
                <h3 className="text-lg font-bold text-gray-800">Recent Orders</h3>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.slice(0, 10).map((order, i) => (
                      <tr key={i} className="hover:bg-pink-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {order.id?.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-right bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          ₱{order.totalAmount?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No orders yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden divide-y divide-gray-100">
                {orders.slice(0, 10).map((order, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-pink-50/30 transition-colors">
                    <div>
                      <div className="font-mono text-sm font-bold text-gray-800 mb-1">{order.id?.slice(0, 8)}...</div>
                      <div className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">₱{order.totalAmount?.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{order.items?.length || 0} items</div>
                    </div>
                  </div>
                ))}
                 {orders.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No orders yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
                  <p className="text-gray-500 mt-1">Review and process customer orders</p>
                </div>
                <div className="flex gap-2">
                   <button
                      onClick={handleClearOrders}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-red-100"
                   >
                      <Trash size={16} /> Clear History
                   </button>
                   <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value as any)}
                      className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none font-medium text-gray-700"
                   >
                      <option value="all">All Orders</option>
                      <option value="messenger">Messenger Orders</option>
                      <option value="place_order">Direct Orders</option>
                   </select>
                </div>
             </div>

             <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-pink-100/50 overflow-hidden">
               {/* Desktop Table */}
               <div className="hidden md:block overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-gray-50 border-b border-gray-200">
                     <tr>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                       <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {orders
                        .filter(order => orderFilter === 'all' || order.orderMethod === orderFilter)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No orders found</td>
                        </tr>
                     ) : (
                        orders
                           .filter(order => orderFilter === 'all' || order.orderMethod === orderFilter)
                           .slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                              {order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                 order.orderMethod === 'place_order' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                 {order.orderMethod === 'place_order' ? 'Direct' : 'Messenger'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                ${!order.status || order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${order.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                                ${order.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                              `}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              ₱{order.totalAmount?.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="text-pink-600 hover:text-pink-900 bg-pink-50 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                     )}
                   </tbody>
                 </table>
               </div>

               {/* Mobile List View */}
               <div className="md:hidden divide-y divide-gray-100">
                 {orders
                    .filter(order => orderFilter === 'all' || order.orderMethod === orderFilter)
                    .length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No orders found</div>
                 ) : (
                    orders
                       .filter(order => orderFilter === 'all' || order.orderMethod === orderFilter)
                       .slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((order) => (
                      <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <div className="font-mono text-sm font-bold text-gray-900">{order.id}</div>
                              <div className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleDateString()}</div>
                           </div>
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${!order.status || order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${order.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                              ${order.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                           `}>
                              {getStatusLabel(order.status)}
                           </span>
                        </div>
                        <div className="flex justify-between items-center">
                           <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                 order.orderMethod === 'place_order' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                 {order.orderMethod === 'place_order' ? 'Direct' : 'Messenger'}
                              </span>
                           </div>
                           <div className="text-right flex items-center gap-3">
                              <span className="font-bold text-gray-900">₱{order.totalAmount?.toFixed(2)}</span>
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="text-pink-600 hover:text-pink-900 bg-pink-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              >
                                View
                              </button>
                           </div>
                        </div>
                      </div>
                    ))
                 )}
               </div>
             </div>
          </div>
        )}
        
        {activeTab === 'products' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Product Management</h1>
                  <p className="text-sm sm:text-base text-gray-500 mt-1">Update pricing and game details</p>
                </div>
                <button
                  onClick={handleSaveCatalog}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-200/50 hover:shadow-xl disabled:opacity-50 w-full sm:w-auto"
                >
                  {isLoading ? 'Saving...' : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </button>
             </div>

             <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-pink-100/50 overflow-hidden">
               {currentCatalog.map(game => (
                 <div key={game.id} className="border-b border-gray-100 last:border-0">
                   <div 
                     className="p-4 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-100 gap-4 md:gap-0"
                     onClick={() => setEditingGame(editingGame?.id === game.id ? null : game)}
                   >
                     <div className="flex items-center gap-4">
                       <img src={game.image} alt={game.name} className="w-10 h-10 rounded-lg object-cover" />
                       <span className="font-bold text-gray-700">{game.name}</span>
                       <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-600">{game.serverLabel || 'Standard'}</span>
                     </div>
                     <span className="text-sm text-gray-500">{game.products.length} products</span>
                   </div>
                   
                   {editingGame?.id === game.id && (
                     <div className="p-6 bg-white animate-in slide-in-from-top-2 border-t border-gray-100">
                        {/* Game Details Editing */}
                        <div className="flex flex-col md:flex-row gap-6 mb-8 pb-8 border-b border-gray-100">
                           <div className="relative group w-32 h-32 flex-shrink-0">
                              <img 
                                 src={editingGame.image} 
                                 alt={editingGame.name} 
                                 className="w-full h-full rounded-xl object-cover border border-gray-200 shadow-sm" 
                              />
                              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center cursor-pointer text-white">
                                 <ImageIcon size={24} className="mb-1" />
                                 <span className="text-xs font-medium">Change</span>
                                 <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadGameImage(editingGame.id, file);
                                    }}
                                 />
                              </label>
                           </div>

                           <div className="flex-1 space-y-4">
                              <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Game Name</label>
                                 <input
                                    type="text"
                                    value={editingGame.name}
                                    onChange={(e) => handleUpdateGameDetails(editingGame.id, { name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg font-bold text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                 />
                              </div>

                              <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Card Size (Homepage)</label>
                                 <p className="text-xs text-gray-500 mb-3">Select how this game card appears on the homepage grid</p>
                                 <div className="flex gap-3">
                                    <label className={`
                                       flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all
                                       ${(!editingGame.gridSpan || editingGame.gridSpan === 'normal') 
                                          ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm' 
                                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                    `}>
                                       <input 
                                          type="radio" 
                                          name={`gridSpan-${editingGame.id}`}
                                          value="normal" 
                                          checked={!editingGame.gridSpan || editingGame.gridSpan === 'normal'}
                                          onChange={() => handleUpdateGameDetails(editingGame.id, { gridSpan: 'normal' })}
                                          className="hidden"
                                       />
                                       <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center">
                                          <div className="w-2 h-2 bg-current rounded-[1px]" />
                                       </div>
                                       <span className="text-sm font-medium">Normal</span>
                                    </label>

                                    <label className={`
                                       flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all
                                       ${editingGame.gridSpan === 'wide' 
                                          ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm' 
                                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                    `}>
                                       <input 
                                          type="radio" 
                                          name={`gridSpan-${editingGame.id}`}
                                          value="wide" 
                                          checked={editingGame.gridSpan === 'wide'}
                                          onChange={() => handleUpdateGameDetails(editingGame.id, { gridSpan: 'wide' })}
                                          className="hidden"
                                       />
                                       <div className="w-8 h-4 border border-current rounded-sm flex items-center justify-center">
                                          <div className="w-6 h-2 bg-current rounded-[1px]" />
                                       </div>
                                       <span className="text-sm font-medium">Wide</span>
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Product List */}
                        <div className="mb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                               <ShoppingBag size={18} className="text-pink-500" />
                               Products ({game.products.length})
                            </h3>
                            <button
                              onClick={() => handleAddProduct(game.id)}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all text-sm font-semibold shadow-lg shadow-pink-200/50 w-full sm:w-auto"
                            >
                              <Plus size={16} />
                              Add Product
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <GripVertical size={14} className="text-pink-500" />
                            Use the arrow buttons to reorder products. Click "Save Changes" when done.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {game.products.map((product, index) => (
                            <div key={product.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-pink-300 transition-all bg-white shadow-sm">
                              {/* Mobile: Order controls at top */}
                              <div className="flex sm:hidden items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                    {index + 1}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleMoveProductUp(game.id, index)}
                                      disabled={index === 0}
                                      className="p-1.5 rounded bg-pink-50 hover:bg-pink-100 text-pink-600 disabled:text-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                                      title="Move up"
                                    >
                                      <ArrowUp size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleMoveProductDown(game.id, index)}
                                      disabled={index === game.products.length - 1}
                                      className="p-1.5 rounded bg-pink-50 hover:bg-pink-100 text-pink-600 disabled:text-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                                      title="Move down"
                                    >
                                      <ArrowDown size={14} />
                                    </button>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteProduct(game.id, product.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
                                  title="Delete product"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                              
                              {/* Desktop: Order controls on left */}
                              <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleMoveProductUp(game.id, index)}
                                  disabled={index === 0}
                                  className="p-1 rounded hover:bg-pink-100 text-pink-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                  title="Move up"
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                  {index + 1}
                                </div>
                                <button
                                  onClick={() => handleMoveProductDown(game.id, index)}
                                  disabled={index === game.products.length - 1}
                                  className="p-1 rounded hover:bg-pink-100 text-pink-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                  title="Move down"
                                >
                                  <ArrowDown size={16} />
                                </button>
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-1 grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Product Name</label>
                                  <input 
                                    type="text" 
                                    value={product.name}
                                    onChange={(e) => handleUpdateProductName(game.id, product.id, e.target.value)}
                                    className="w-full text-sm font-medium bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none focus:bg-white transition-colors"
                                    placeholder="e.g. 30000 Diamonds"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price (₱)</label>
                                  <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₱</span>
                                     <input 
                                       type="number" 
                                       value={product.price}
                                       onChange={(e) => handleUpdateProductPrice(game.id, product.id, parseFloat(e.target.value) || 0)}
                                       className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none focus:bg-white transition-colors"
                                       placeholder="0"
                                     />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Desktop: Delete Button on right */}
                              <button
                                onClick={() => handleDeleteProduct(game.id, product.id)}
                                className="hidden sm:block p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors flex-shrink-0"
                                title="Delete product"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Payment Methods</h1>
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">Configure payment options for customers</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                   <button
                     onClick={() => {
                        setEditingPayment(null);
                        setTempPayment({});
                        setIsAddingPayment(true);
                     }}
                     className="bg-gray-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base whitespace-nowrap"
                   >
                     <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Add Payment
                   </button>
                   <button
                     onClick={handleSavePayments}
                     disabled={isLoading}
                     className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-pink-200/50 hover:shadow-xl disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                   >
                     {isLoading ? 'Saving...' : (
                       <>
                         <Save size={16} className="sm:w-[18px] sm:h-[18px]" /> Save Changes
                       </>
                     )}
                   </button>
                </div>
             </div>

             {/* Add/Edit Form */}
             {isAddingPayment && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-pink-100/50 p-4 sm:p-6 animate-in fade-in">
                   <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">{editingPayment ? 'Edit Payment Method' : 'Add New Payment Method'}</h3>
                   <div className="grid grid-cols-1 gap-4 mb-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                         <input 
                            type="text" 
                            value={tempPayment.name || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm sm:text-base"
                            placeholder="e.g. GCash, BDO, Maya"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                         <input 
                            type="text" 
                            value={tempPayment.accountNumber || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, accountNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm sm:text-base"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                         <input 
                            type="text" 
                            value={tempPayment.accountName || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, accountName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm sm:text-base"
                         />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                         {/* Logo / Icon Upload */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Logo / Icon</label>
                            <div className="flex items-center gap-4">
                               {tempPayment.logo ? (
                                  <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden group">
                                     <img src={tempPayment.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                     <button 
                                        onClick={() => setTempPayment({ ...tempPayment, logo: undefined })}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                     >
                                        <X size={12} />
                                     </button>
                                  </div>
                               ) : (
                                  <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                     <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                           const file = e.target.files?.[0];
                                           if (file) handleUploadPaymentLogo(file);
                                        }}
                                     />
                                     <Upload size={20} className="text-gray-400 group-hover:text-pink-500 mb-1" />
                                     <span className="text-[10px] text-gray-500 font-medium">Upload Logo</span>
                                  </div>
                               )}
                               <div className="text-xs text-gray-500">
                                  <p>Displayed on payment selection.</p>
                                  <p>Rec: Square (1:1)</p>
                               </div>
                            </div>
                         </div>

                         {/* QR Code Upload */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Image</label>
                            <div className="flex items-center gap-4">
                               {tempPayment.qrCode ? (
                                  <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden group">
                                     <img src={tempPayment.qrCode} alt="QR" className="w-full h-full object-contain" />
                                     <button 
                                        onClick={() => setTempPayment({ ...tempPayment, qrCode: undefined })}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                     >
                                        <X size={12} />
                                     </button>
                                  </div>
                               ) : (
                                  <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                     <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => {
                                           const file = e.target.files?.[0];
                                           if (file) handleUploadPaymentQR(file);
                                        }}
                                     />
                                     <Upload size={20} className="text-gray-400 group-hover:text-pink-500 mb-1" />
                                     <span className="text-[10px] text-gray-500 font-medium">Upload QR</span>
                                  </div>
                               )}
                               <div className="text-xs text-gray-500">
                                  <p>Displayed on proof page.</p>
                                  <p>Rec: Clear QR Image</p>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Type (Optional)</label>
                         <input 
                            type="text" 
                            value={tempPayment.type || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm sm:text-base"
                            placeholder="e.g. E-Wallet, Bank"
                         />
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button 
                        onClick={() => {
                           setIsAddingPayment(false);
                           setEditingPayment(null);
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm sm:text-base order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSavePayment}
                        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-pink-200/50 text-sm sm:text-base order-1 sm:order-2"
                      >
                        {editingPayment ? 'Update Method' : 'Add Method'}
                      </button>
                   </div>
                </div>
             )}

             <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-pink-100/50 overflow-hidden">
               <div className="divide-y divide-gray-100">
                 {currentPayments.map(payment => (
                   <div 
                      key={payment.id} 
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer gap-4 md:gap-0"
                      onClick={() => {
                         setEditingPayment(payment);
                         setTempPayment(payment);
                         setIsAddingPayment(true);
                      }}
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                           {payment.id === 'gcash' ? '💳' : '💰'}
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-800">{payment.name}</h3>
                           <div className="text-sm text-gray-500 flex flex-col md:flex-row md:gap-4">
                              {payment.accountNumber && <span><span className="font-medium">No:</span> {payment.accountNumber}</span>}
                              {payment.accountName && <span><span className="font-medium">Name:</span> {payment.accountName}</span>}
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 self-end md:self-auto">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setEditingPayment(payment);
                             setTempPayment(payment);
                             setIsAddingPayment(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePayment(payment.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash size={18} />
                        </button>
                     </div>
                   </div>
                 ))}
                 {currentPayments.length === 0 && (
                   <div className="p-8 text-center text-gray-500">No payment methods configured</div>
                 )}
               </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Site Settings</h1>
                  <p className="text-gray-500 mt-1">Configure shop behavior and banners</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-pink-200/50 hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </button>
             </div>

             <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-pink-100/50 p-6 space-y-8">
               
               {/* Order Option */}
               <div>
                 <h3 className="font-bold text-gray-800 mb-2">Order Option</h3>
                 <p className="text-sm text-gray-500 mb-4">
                   Choose how customers can place orders. "Order via Messenger" shows receipt upload, copy message, and messenger button. "Place Order" shows only receipt upload and place order button.
                 </p>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Order Method</label>
                    <div className="relative">
                      <select 
                        value={siteSettings.orderMethod}
                        onChange={(e) => onUpdateSettings({ ...siteSettings, orderMethod: e.target.value as any })}
                        className="w-full appearance-none bg-white border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-700 font-medium cursor-pointer"
                      >
                        <option value="messenger">Order via Messenger</option>
                        <option value="place_order">Place Order</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                 </div>
               </div>

               {/* Hero Slideshow */}
               <div>
                 <h3 className="font-bold text-gray-800 mb-2">Hero Slideshow (Customer Page)</h3>
                 <p className="text-sm text-gray-500 mb-4">
                   Upload up to 5 images for the hero slideshow. These will be displayed on the customer page when viewing "All" categories. Images will auto-rotate every 1.5 seconds.
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[0, 1, 2, 3, 4].map((index) => (
                     <div key={index} className="flex flex-col gap-2">
                       <label className="text-sm font-semibold text-gray-600">Hero Image {index + 1}</label>
                       
                       {siteSettings.banners[index] ? (
                         <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                           <img 
                             src={siteSettings.banners[index]} 
                             alt={`Banner ${index + 1}`} 
                             className="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                               onClick={() => handleRemoveBanner(index)}
                               className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors transform hover:scale-110"
                             >
                               <X size={20} />
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-pink-400 bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group">
                           <input 
                             type="file" 
                             accept="image/*"
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) handleUploadBanner(file);
                             }}
                           />
                           <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                             <Upload size={24} className="text-gray-400 group-hover:text-pink-500" />
                           </div>
                           <span className="text-sm text-gray-500 font-medium group-hover:text-pink-500">Upload Image</span>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
{/* Admin Password Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">Admin Password</h3>
                        <p className="text-xs text-gray-500">Manage your admin login password</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Change Password
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Change Admin Password</h3>
              <p className="text-sm text-gray-600 mb-6">Enter your current password and choose a new password.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 characters)" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="flex-1 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">Cancel</button>
                <button onClick={handleChangePassword} className="flex-1 py-2.5 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600">Change Password</button>
              </div>
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                   <div className="flex flex-col gap-1">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Order Details <span className="text-sm font-mono font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">{selectedOrder.id}</span>
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit capitalize
                          ${!selectedOrder.status || selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${selectedOrder.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                          ${selectedOrder.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                       `}>
                          {getStatusLabel(selectedOrder.status)}
                       </span>
                   </div>
                   <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                     <X size={20} />
                   </button>
                </div>
                
                <div className="p-6 space-y-6">
                   {/* Receipt */}
                   <div>
                      <h3 className="font-bold text-gray-700 mb-2">Payment Receipt</h3>
                      <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 aspect-video relative group">
                         <img src={selectedOrder.receiptUrl} alt="Receipt" className="w-full h-full object-contain bg-black/5" />
                         <a 
                           href={selectedOrder.receiptUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                         >
                           <div className="bg-white/90 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-sm font-medium shadow-lg">
                              <Eye size={16} /> View Full Size
                           </div>
                         </a>
                      </div>
                   </div>

                   {/* Order Items */}
                   <div>
                      <h3 className="font-bold text-gray-700 mb-4 hidden">Items Ordered</h3>
                      <div className="space-y-6">
                         {selectedOrder.items?.map((item: any, i: number) => {
                            const serverDisplay = item.server && item.server !== 'N/A' ? `(${item.server})` : '';
                            const idDisplay = `ID: ${item.playerId} ${serverDisplay}`.trim();
                            
                            return (
                               <div key={i} className="flex flex-col gap-1 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                  <h4 className="text-lg font-bold text-gray-800">{item.game.name}</h4>
                                  <p className="text-gray-600 font-medium">{item.product.name}</p>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        {idDisplay}
                                     </span>
                                     <button 
                                        onClick={async () => {
                                           try {
                                              await navigator.clipboard.writeText(idDisplay);
                                              toast.success("ID copied");
                                           } catch (err) {
                                              const textArea = document.createElement("textarea");
                                              textArea.value = idDisplay;
                                              document.body.appendChild(textArea);
                                              textArea.select();
                                              try {
                                                document.execCommand('copy');
                                                toast.success("ID copied");
                                              } catch (e) {
                                                toast.error("Failed to copy");
                                              }
                                              document.body.removeChild(textArea);
                                           }
                                        }}
                                        className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                                        title="Copy ID"
                                     >
                                        <Copy size={16} />
                                     </button>
                                  </div>
                                  
                                  <div className="font-bold text-gray-800 mt-1">
                                     Price: <span className="text-pink-600">₱{item.product.price}</span>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                         <span className="font-bold text-gray-700">Total Amount:</span>
                         <span className="text-2xl font-bold text-pink-600">₱{selectedOrder.totalAmount?.toFixed(2)}</span>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex gap-4 pt-4">
                      {(!selectedOrder.status || selectedOrder.status === 'pending') && (
                         <>
                            <button 
                               onClick={() => setShowRejectModal(true)}
                               className="flex-1 py-3 px-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 flex items-center justify-center gap-2"
                            >
                               <XCircle size={18} /> Reject
                            </button>
                            <button 
                               onClick={() => setShowApproveModal(true)}
                               className="flex-1 py-3 px-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                            >
                               <CheckCircle size={18} /> Approve
                            </button>
                         </>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Order</h3>
                 <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (e.g. Invalid ID, Wrong Server)..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                 />
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setShowRejectModal(false)}
                       className="flex-1 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={() => handleUpdateOrder(selectedOrder.id, 'rejected', rejectReason)}
                       disabled={!rejectReason.trim()}
                       className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       Confirm Reject
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Approve Order</h3>
                 <p className="text-sm text-gray-600 mb-4">
                    Confirm approval for Order #{selectedOrder?.id?.slice(0,8)}. You can optionally add notes for the customer.
                 </p>
                 <textarea
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    placeholder="Optional notes (e.g. Processed successfully)..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                 />
                 <div className="flex gap-3">
                    <button 
                       onClick={() => {
                          setShowApproveModal(false);
                          setApproveNote('');
                       }}
                       className="flex-1 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={() => {
                          handleUpdateOrder(selectedOrder.id, 'approved', approveNote);
                          setShowApproveModal(false);
                          setApproveNote('');
                       }}
                       className="flex-1 py-2 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600"
                    >
                       Confirm Approve
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>

  );
}