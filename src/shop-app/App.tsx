import { useState, useEffect } from 'react';
import { ChevronLeft, ShoppingCart, X, Copy, MessageCircle } from 'lucide-react';
import { Toaster, toast } from 'sonner@2.0.3';
import { HomePage } from '../components/HomePage';
import { OrderPage } from '../components/OrderPage';
import { PaymentPage } from '../components/PaymentPage';
import { ProofPage } from '../components/ProofPage';
import { CartPage } from '../components/CartPage';
import { TrackOrderPage } from '../components/TrackOrderPage';
import logo from "figma:asset/9568b70918caed8160ab30453aa7460f37f37f7c.png";
import { Game, Payment, OrderData, CartItem } from '../shared/types';
import { INITIAL_CATALOG, MESSENGER_USERNAME, GCASH_NUMBER } from '../shared/constants';
import { api } from '../shared/api';

export default function ShopApp() {
  const [currentPage, setCurrentPage] = useState<'home' | 'order' | 'payment' | 'proof' | 'cart' | 'track'>('home');
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [orderSummary, setOrderSummary] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    game: null,
    playerId: '',
    server: '',
    ign: '',
    product: null,
    quantity: 1,
    payment: null,
    receiptFile: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Catalog
        const catalogData = await api.getCatalog();
        if (catalogData && catalogData.length > 0) {
          setCatalog(catalogData);
        } else {
          // Seed if empty
          await api.updateCatalog(INITIAL_CATALOG);
        }

        // Fetch Payments
        const paymentsData = await api.getPayments();
        if (paymentsData && paymentsData.length > 0) {
          setPayments(paymentsData);
        } else {
          // Seed payments
          await api.updatePayments([
            { id: "gcash", name: "GCash" },
            { id: "paymaya", name: "PayMaya" },
            { id: "grabpay", name: "GrabPay" },
          ]);
        }

        // Fetch Site Settings
        const settingsData = await api.getSettings();
        if (settingsData) {
          setSiteSettings(settingsData);
        }

      } catch (err) {
        console.error("Failed to fetch data, using default", err);
      }
    };
    fetchData();
  }, []);

  const updateOrderData = (updates: Partial<OrderData>) => {
    setOrderData(prev => ({ ...prev, ...updates }));
  };

  const handleSelectGame = (game: Game) => {
    updateOrderData({ game, product: null, quantity: 1 });
    setCurrentPage('order');
  };

  const handleContinueToPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setCurrentPage('payment');
  };

  const handleAddToCart = () => {
    if (!orderData.game || !orderData.product || !orderData.playerId.trim() || !orderData.server.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const newCartItem: CartItem = {
      id: Date.now().toString(),
      game: orderData.game,
      playerId: orderData.playerId,
      server: orderData.server,
      ign: orderData.ign,
      product: orderData.product,
      quantity: orderData.quantity,
    };
    
    setCartItems(prev => [...prev, newCartItem]);
    
    // Reset order data
    setOrderData({
      game: null,
      playerId: '',
      server: '',
      ign: '',
      product: null,
      quantity: 1,
      payment: null,
      receiptFile: null,
    });
    
    toast.success('Added to cart!', { duration: 3000 });
    setCurrentPage('home');
  };

  const handleBuyNow = () => {
    if (!orderData.game || !orderData.product || !orderData.playerId.trim() || !orderData.server.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const newCartItem: CartItem = {
      id: Date.now().toString(),
      game: orderData.game,
      playerId: orderData.playerId,
      server: orderData.server,
      ign: orderData.ign,
      product: orderData.product,
      quantity: orderData.quantity,
    };
    
    setCartItems(prev => [...prev, newCartItem]);
    
    // Reset order data
    setOrderData({
      game: null,
      playerId: '',
      server: '',
      ign: '',
      product: null,
      quantity: 1,
      payment: null,
      receiptFile: null,
    });
    
    setCurrentPage('payment');
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const handleContinueToProof = () => {
    if (!orderData.payment) {
      toast.error('Please select a payment method');
      return;
    }
    setCurrentPage('proof');
  };

  const handlePlaceOrder = async () => {
    if (!orderData.payment || !orderData.receiptFile) {
      toast.error('Please upload payment receipt');
      return;
    }

    if (orderData.receiptFile.size > 5 * 1024 * 1024) {
      toast.error('File too large. Please upload an image smaller than 5MB for faster processing.');
      return;
    }

    try {
      setIsUploading(true);

      // Upload receipt
      const { url } = await api.uploadReceipt(orderData.receiptFile);

      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const orderNo = 'ORD-' + Date.now().toString().slice(-8);

      // Group items by Player ID + Server + IGN + Game
      const groupedItems = cartItems.reduce((acc, item) => {
        const key = `${item.game.name}|${item.server}|${item.playerId}|${item.ign || ''}`;
        if (!acc[key]) {
          acc[key] = {
            gameName: item.game.name,
            serverLabel: item.game.serverLabel || '',
            server: item.server,
            playerId: item.playerId,
            ign: item.ign || '',
            items: [],
            total: 0
          };
        }
        acc[key].items.push(item);
        acc[key].total += item.product.price * item.quantity;
        return acc;
      }, {} as Record<string, { gameName: string, serverLabel: string, server: string, playerId: string, ign: string, items: CartItem[], total: number }>);

      let msg = ``;
      const groups = Object.values(groupedItems);
      
      // Part 1: Details
      groups.forEach((group, index) => {
        const serverText = group.serverLabel ? `${group.serverLabel} ORDER` : `${group.server === 'N/A' ? '' : group.server} ORDER`;
        const gameHeader = `${group.gameName.toUpperCase()} ${serverText}`.replace(/\s+/g, ' ').trim();
        const playerLine = `ID: ${group.playerId}${group.server !== 'N/A' && group.server ? ` (${group.server})` : ''}${group.ign ? ` ${group.ign}` : ''}`;
        
        msg += `${gameHeader}\n${playerLine}\nORDER :\n`;
        group.items.forEach(item => {
           msg += `${item.quantity > 1 ? `${item.quantity}x qty ` : ''}${item.product.name} - ₱${(item.product.price * item.quantity).toFixed(0)}\n`;
        });
        msg += `\n`; // Spacing between groups
      });

      // Part 2: Totals
      groups.forEach(group => {
         msg += `TOTAL: ₱${group.total.toLocaleString()}\n`;
      });
      
      msg += `PAYMENT RECEIPT: ${url}`;


      // Save order to database for Admin Sales Tracking
      try {
        const orderRecord = {
          id: orderNo,
          items: cartItems,
          totalAmount: total,
          receiptUrl: url,
          status: 'pending',
          timestamp: new Date().toISOString(),
          customerPayment: orderData.payment?.name,
          orderMethod: siteSettings.orderMethod
        };

        await api.createOrder(orderRecord);
      } catch (saveError) {
        console.error("Failed to save order record", saveError);
        // We continue even if saving tracking fails, so user can still copy summary
      }

      const encodedMsg = encodeURIComponent(msg);
      
      setOrderSummary(msg);
      setShowSuccessModal(true);
      
      // Clear cart after order
      setCartItems([]);
      setOrderData({
        game: null,
        playerId: '',
        server: '',
        ign: '',
        product: null,
        quantity: 1,
        payment: null,
        receiptFile: null,
      });
      setCurrentPage('home');
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-200 to-indigo-300 text-gray-900 overflow-x-hidden">
      <Toaster position="top-center" duration={1500} />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-200/50 shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentPage !== 'home' && (
              <button
                onClick={() => {
                  if (currentPage === 'order') setCurrentPage('home');
                  else if (currentPage === 'payment') setCurrentPage('cart');
                  else if (currentPage === 'proof') setCurrentPage('payment');
                  else if (currentPage === 'cart') setCurrentPage('home');
                }}
                className="p-3 hover:bg-pink-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-7 h-7 text-pink-600" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage('home')} className="focus:outline-none transition-transform hover:scale-105 active:scale-95">
                <img src={logo} alt="Helia" className="h-14 w-auto object-contain animate-bounce" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('track')}
              className="px-4 py-2 bg-white/50 hover:bg-white text-pink-600 font-semibold text-sm rounded-lg backdrop-blur-sm transition-all shadow-sm hover:shadow-md border border-pink-100 hidden md:block"
            >
              Track Order
            </button>
            <button 
              onClick={() => setCurrentPage('cart')}
              className="relative p-2 hover:bg-pink-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-pink-600" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'home' && (
          <HomePage 
            games={catalog} 
            onSelectGame={handleSelectGame} 
            banners={siteSettings.banners}
          />
        )}
        
        {currentPage === 'order' && orderData.game && (
          <OrderPage
            game={orderData.game}
            orderData={orderData}
            updateOrderData={updateOrderData}
            onContinue={handleBuyNow}
            onAddToCart={handleAddToCart}
          />
        )}
        
        {currentPage === 'payment' && (
          <PaymentPage
            payments={payments}
            selectedPayment={orderData.payment}
            onSelectPayment={(payment) => updateOrderData({ payment })}
            onContinue={handleContinueToProof}
          />
        )}
        
        {currentPage === 'proof' && (
          <ProofPage
            orderData={orderData}
            cartItems={cartItems}
            gcashNumber={GCASH_NUMBER}
            updateOrderData={updateOrderData}
            onPlaceOrder={handlePlaceOrder}
            isUploading={isUploading}
            orderMethod={siteSettings.orderMethod}
            payments={payments}
          />
        )}
        
        {currentPage === 'cart' && (
          <CartPage
            cartItems={cartItems}
            onRemoveFromCart={handleRemoveFromCart}
            updateOrderData={updateOrderData}
            onContinue={handleContinueToPayment}
          />
        )}

        {currentPage === 'track' && (
          <TrackOrderPage onBack={() => setCurrentPage('home')} />
        )}
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        <p>© 2024 Helia Game Shop</p>
      </footer>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl text-green-500">✓</span> Order Placed!
              </h3>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            {siteSettings.orderMethod === 'messenger' ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Please copy the summary below and send it to our Messenger to process your order.
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 relative">
                  <textarea 
                    id="order-summary-text"
                    readOnly
                    value={orderSummary}
                    className="w-full bg-transparent text-xs font-mono text-gray-700 h-40 focus:outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      const textarea = document.getElementById('order-summary-text') as HTMLTextAreaElement;
                      if (textarea) {
                        textarea.select();
                        try {
                          // Try execCommand first as it works better in some restricted environments
                          const successful = document.execCommand('copy');
                          if (successful) {
                            toast.success('Copied to clipboard!');
                          } else {
                            // Fallback to clipboard API
                            navigator.clipboard.writeText(orderSummary)
                              .then(() => toast.success('Copied to clipboard!'))
                              .catch(() => toast.error('Failed to copy. Please select and copy manually.'));
                          }
                        } catch (err) {
                          toast.error('Failed to copy. Please select and copy manually.');
                        }
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-white shadow-sm border border-gray-200 rounded-lg text-gray-600 hover:text-pink-600 hover:border-pink-200 transition-all"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      // Auto-copy functionality
                      try {
                        await navigator.clipboard.writeText(orderSummary);
                        toast.success('Order summary copied! Ready to paste.');
                      } catch (err) {
                        // Fallback copy
                        const textarea = document.getElementById('order-summary-text') as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.select();
                          document.execCommand('copy');
                          toast.success('Order summary copied! Ready to paste.');
                        }
                      }

                      // Open Messenger with pre-fill attempt
                      const encodedMsg = encodeURIComponent(orderSummary);
                      window.open(`https://m.me/${MESSENGER_USERNAME}?text=${encodedMsg}`, '_blank');
                      setShowSuccessModal(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Copy & Open Messenger
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Thank you for your order! We have received your payment receipt and will process your top-up shortly.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}