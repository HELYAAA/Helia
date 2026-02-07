import { useState } from "react";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../shared/supabase-info";
import { toast } from "sonner@2.0.3";

interface TrackOrderPageProps {
  onBack: () => void;
}

export function TrackOrderPage({
  onBack,
}: TrackOrderPageProps) {
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-245feaad/order/${orderId.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Order not found");
        }
        throw new Error("Failed to fetch order");
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <CheckCircle className="w-6 h-6 text-green-600" />
        );
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Completed";
      case "rejected":
        return "Rejected";
      default:
        return "Processing";
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-pink-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Shop
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Search className="text-pink-500" /> Track Order
      </h1>

      <form onSubmit={handleTrack} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID (e.g., ORD-12345678)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !orderId.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Track <Search size={18} />
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-500 mt-2 text-sm">{error}</p>
        )}
      </form>

      {order && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`p-4 border-b flex items-center justify-between ${getStatusColor(order.status || "pending")}`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(order.status || "pending")}
              <div>
                <h3 className="font-bold uppercase tracking-wide text-sm">
                  {getStatusLabel(order.status || "pending")}
                </h3>
                <p className="text-xs opacity-80">
                  {new Date(order.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {order.status === "rejected" && order.notes && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                <p className="font-bold mb-1">
                  Reason for Rejection:
                </p>
                <p>{order.notes}</p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Order Items
              </h4>
              <div className="space-y-2">
                {order.items?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {item.product.name} ({item.game.name})
                    </span>
                    <span className="font-semibold">
                      ₱{item.product.price}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span>₱{order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Payment
              </h4>
              <p className="text-sm text-gray-700">
                {order.customerPayment || "Unknown"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}