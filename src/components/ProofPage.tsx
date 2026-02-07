import { useState, useMemo } from 'react';
import { Copy, Check, Upload } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { OrderData, CartItem, Payment } from '../shared/types';

interface ProofPageProps {
  orderData: OrderData;
  cartItems: CartItem[];
  gcashNumber: string;
  updateOrderData: (updates: Partial<OrderData>) => void;
  onPlaceOrder: () => void;
  isUploading: boolean;
  orderMethod?: 'messenger' | 'place_order';
  payments?: Payment[];
}

export function ProofPage({ orderData, cartItems, gcashNumber, updateOrderData, onPlaceOrder, isUploading, orderMethod = 'messenger', payments = [] }: ProofPageProps) {
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get the latest payment details from the payments list if available, otherwise use orderData.payment
  const currentPayment = useMemo(() => {
    if (!orderData.payment) return null;
    const updatedPayment = payments.find(p => p.id === orderData.payment?.id);
    return updatedPayment || orderData.payment;
  }, [orderData.payment, payments]);

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Use dynamic payment info if available, otherwise fallback to prop (legacy/default)
  const paymentNumber = currentPayment?.accountNumber || gcashNumber;
  const paymentName = currentPayment?.accountName || "Helia Game Shop";
  const paymentType = currentPayment?.name || "Payment Method";
  const qrCodeUrl = currentPayment?.qrCode;

  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;

    try {
      const loadingToast = toast.loading('Downloading QR Code...');
      
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentPayment?.name || 'payment'}-QR.png`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image. Try "Tap to View QR" instead.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentNumber);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = paymentNumber;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        toast.error('Failed to copy');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateOrderData({ receiptFile: file });
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isValid = currentPayment && orderData.receiptFile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-lg">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
          <span className="text-2xl text-pink-500">|</span> Payment Details
        </h2>

        {/* Payment Details */}
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4 text-gray-800">Send payment to ({paymentType}):</h3>
          
          <div className="mb-2">
             <p className="text-sm text-gray-600 mb-1">Account Number / Details</p>
             <div 
               onClick={handleCopy}
               className="bg-white rounded-lg p-4 cursor-pointer hover:bg-pink-50 transition-colors border border-pink-200"
             >
               <div className="flex items-center justify-between">
                 <span className="font-mono text-lg font-bold text-pink-600">{paymentNumber}</span>
                 {copied ? (
                   <Check className="w-5 h-5 text-pink-500" />
                 ) : (
                   <Copy className="w-5 h-5 text-pink-400" />
                 )}
               </div>
             </div>
             <p className="text-xs text-center text-gray-600 mt-1">Tap to copy</p>
          </div>

          {currentPayment?.accountName && (
             <div className="mt-4">
                <p className="text-sm text-gray-600 mb-1">Account Name</p>
                <div className="bg-white rounded-lg p-3 border border-pink-200">
                   <span className="font-bold text-gray-800">{currentPayment.accountName}</span>
                </div>
             </div>
          )}

          {qrCodeUrl ? (
             <div className="mt-6 bg-white rounded-xl p-4 max-w-[200px] mx-auto shadow-md border border-gray-100">
                <img 
                   src={qrCodeUrl} 
                   alt={`${currentPayment?.name} QR Code`} 
                   className="w-full h-full object-contain rounded-lg"
                />
                <div className="flex flex-col gap-2 mt-3">
                   <button 
                      onClick={handleDownloadQR}
                      className="w-full text-xs font-semibold bg-pink-50 text-pink-600 py-2 rounded-lg hover:bg-pink-100 transition-colors text-center block cursor-pointer"
                   >
                      Tap to Download QR
                   </button>
                   <a 
                      href={qrCodeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full text-xs font-semibold border border-gray-200 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block"
                   >
                      Tap to View QR
                   </a>
                </div>
             </div>
          ) : (
            // Fallback for legacy GCash
            currentPayment?.id === 'gcash' && (
              <div className="mt-6 bg-white rounded-xl p-4 max-w-[200px] mx-auto shadow-md">
                <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-8 gap-1 p-2">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 ${
                          Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-center text-xs text-black mt-2 font-semibold">Scan to Pay</p>
              </div>
            )
          )}
        </div>

        {/* Receipt Upload */}
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <span className="text-2xl text-pink-500">|</span> Upload Payment Receipt
            <span className="text-rose-600 text-sm font-bold">(required)</span>
          </h3>
          
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 hover:border-pink-500 transition-colors cursor-pointer bg-white">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-pink-400" />
                <p className="text-sm text-gray-700 mb-1 font-medium">
                  {orderData.receiptFile ? orderData.receiptFile.name : 'Click to upload receipt'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </label>

          {/* Preview */}
          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2 font-medium">Preview:</p>
              <div className="bg-white rounded-lg p-3 border border-pink-200 shadow-sm">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-60 mx-auto rounded-lg object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">File: {orderData.receiptFile?.name}</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="mt-6 bg-pink-50 border border-pink-200 rounded-xl p-6">
          <h3 className="font-semibold mb-3 text-gray-800">Order Summary</h3>
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div key={item.id} className="pb-3 border-b border-pink-200 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800">{item.game.name}</span>
                  <span className="font-bold text-pink-600">₱{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>{item.product.name} × {item.quantity}</div>
                  <div className="text-xs">ID: {item.playerId} | Server: {item.server}</div>
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-pink-300 flex justify-between text-lg">
              <span className="text-gray-700 font-semibold">Total Payment:</span>
              <span className="font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                ₱{total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={onPlaceOrder}
          disabled={!isValid || isUploading}
          className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all uppercase shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              Uploading Receipt...
            </span>
          ) : (
            orderMethod === 'place_order' ? "Place Order" : "Place Order via Messenger"
          )}
        </button>

        <p className="text-xs text-center text-gray-500 mt-3">
          {orderMethod === 'place_order' 
            ? "Your order will be processed after receipt verification" 
            : "Your order details will be sent to our Messenger for processing"}
        </p>
      </div>
    </div>
  );
}