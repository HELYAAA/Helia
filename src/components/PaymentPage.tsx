import type { Payment } from '../shared/types';

interface PaymentPageProps {
  payments: Payment[];
  selectedPayment: Payment | null;
  onSelectPayment: (payment: Payment) => void;
  onContinue: () => void;
}

export function PaymentPage({ payments, selectedPayment, onSelectPayment, onContinue }: PaymentPageProps) {
  const paymentIcons: Record<string, string> = {
    gcash: '💳',
    paymaya: '💰',
    grabpay: '🚗',
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-pink-100 shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-gray-800">
          <span className="text-xl sm:text-2xl text-pink-500">|</span> Select Payment Method
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {payments.map((payment) => (
            <button
              key={payment.id}
              onClick={() => onSelectPayment(payment)}
              className={`bg-white border border-pink-200 rounded-xl p-4 sm:p-6 hover:bg-pink-50 hover:border-pink-400 transition-all ${
                selectedPayment?.id === payment.id 
                  ? 'ring-2 ring-pink-500 border-pink-500 bg-pink-50' 
                  : ''
              }`}
            >
              {payment.logo ? (
                <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 rounded-lg overflow-hidden">
                   <img src={payment.logo} alt={payment.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{paymentIcons[payment.id] || '💵'}</div>
              )}
              <div className="font-bold text-sm sm:text-base text-gray-800 break-words">{payment.name}</div>
            </button>
          ))}
        </div>

        <button
          onClick={onContinue}
          disabled={!selectedPayment}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-sm sm:text-base"
        >
          Next
        </button>
      </div>
    </div>
  );
}