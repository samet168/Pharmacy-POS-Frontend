'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, DollarSign, QrCode, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Process payment logic
      toast.success('Payment successful!');
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="text-slate-600">Complete your purchase</p>
      </div>

      <Card className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold">$0.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax</span>
            <span className="font-semibold">$0.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span className="font-semibold text-green-600">-$0.00</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-2">
            <span>Total</span>
            <span>$0.00</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('CASH')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
              paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <DollarSign className="h-6 w-6" />
            <span className="font-semibold">Cash</span>
          </button>
          <button
            onClick={() => setPaymentMethod('KHQR')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
              paymentMethod === 'KHQR' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <QrCode className="h-6 w-6" />
            <span className="font-semibold">KHQR</span>
          </button>
          <button
            onClick={() => setPaymentMethod('CARD')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
              paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="font-semibold">Card</span>
          </button>
          <button
            onClick={() => setPaymentMethod('WALLET')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
              paymentMethod === 'WALLET' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <Smartphone className="h-6 w-6" />
            <span className="font-semibold">Wallet</span>
          </button>
        </div>
      </Card>

      {paymentMethod === 'CASH' && (
        <Card className="p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Cash Payment</h2>
          <Input
            label="Amount Paid"
            type="number"
            placeholder="Enter amount"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between text-lg font-bold">
              <span>Change Due</span>
              <span>$0.00</span>
            </div>
          </div>
        </Card>
      )}

      {paymentMethod === 'KHQR' && (
        <Card className="p-4 mb-4 text-center">
          <h2 className="text-lg font-semibold mb-4">Scan KHQR Code</h2>
          <div className="w-48 h-48 bg-slate-100 mx-auto mb-4 flex items-center justify-center">
            <QrCode className="h-24 w-24 text-slate-400" />
          </div>
          <p className="text-slate-600 text-sm">Scan with your banking app to pay</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline">Check Status</Button>
            <Button>Confirm Manually</Button>
          </div>
        </Card>
      )}

      <Button
        className="w-full"
        onClick={handlePayment}
        loading={loading}
      >
        Complete Payment
        <CheckCircle className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}