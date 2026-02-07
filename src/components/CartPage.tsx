import { Trash2 } from 'lucide-react';
import type { CartItem } from '../shared/types';

interface CartPageProps {
  cartItems: CartItem[];
  onRemoveFromCart: (itemId: string) => void;
  updateOrderData: (updates: any) => void;
  onContinue: () => void;
}

export function CartPage({ cartItems, onRemoveFromCart, onContinue }: CartPageProps) {
  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-lg">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
          <span className="text-2xl text-pink-500">|</span> Shopping Cart
          {cartItems.length > 0 && (
            <span className="text-sm font-normal text-gray-600">({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
          )}
        </h2>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 text-sm">Add items to your cart to continue</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                  <div className="flex gap-4">
                    <img 
                      src={item.game.image} 
                      alt={item.game.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 mb-1 truncate">{item.game.name}</h3>
                      <p className="text-sm text-gray-600 mb-1 truncate">{item.product.name}</p>
                      <div className="text-xs text-gray-500">
                        <span>ID: {item.playerId}</span>
                        <span className="mx-2">|</span>
                        <span>Server: {item.server}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between">
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="font-bold text-pink-600 text-sm">₱{item.product.price.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                <span className="font-semibold text-gray-800">₱{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-pink-200">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  ₱{total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Proceed to Payment
            </button>
          </>
        )}
      </div>
    </div>
  );
}