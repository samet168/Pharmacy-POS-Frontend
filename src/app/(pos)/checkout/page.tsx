'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, DollarSign, QrCode, Smartphone, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ordersApi } from '@/lib/api/orders';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KHQR' | 'CARD' | 'WALLET'>('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setOrderLoading(true);
    try {
      const order = await ordersApi.getById(parseInt(orderId));
      setOrderData(order);
      // Pre-fill amount paid with the grand total or final amount
      setAmountPaid(order.grandTotal?.toString() || order.finalAmount?.toString() || '');
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
      // Redirect to orders page if order not found
      router.push('/orders');
    } finally {
      setOrderLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (orderId) {
        // Complete payment for existing order
        const paid = parseFloat(amountPaid) || 0;
        const orderTotal = orderData?.grandTotal || orderData?.finalAmount || 0;
        
        if (paid < orderTotal) {
          toast.error('Amount paid is less than total');
          setLoading(false);
          return;
        }

        // Process payment for existing order
        // For existing orders, we'll update the payment status
        // Note: Backend may need a dedicated payment endpoint for existing orders
        const result = await ordersApi.update(parseInt(orderId), {
          payments: [{
            orderId: parseInt(orderId),
            paymentMethod: paymentMethod as 'CASH' | 'KHQR' | 'CARD' | 'WALLET',
            amountPaid: paid,
            currency: 'USD',
          }],
        });
        
        toast.success('Payment successful! Order updated.');
        router.push('/orders');
      } else {
        // Process new checkout (existing logic)
        toast.success('Payment successful!');
        router.push('/pos/sell');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const orderTotal = orderData?.grandTotal || orderData?.finalAmount || 0;
  const changeDue = amountPaid ? parseFloat(amountPaid) - orderTotal : 0;

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4 flex items-center gap-4">
        <Button
          variant="outline"
          shape="pill"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {orderId ? 'Complete Payment' : 'Checkout'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {orderId ? `Order #${orderData?.invoiceNumber || orderId}` : 'Complete your purchase'}
          </p>
        </div>
      </div>

      {orderData && (
        <Card className="p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4 dark:text-slate-100">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Order Number</span>
              <span className="font-semibold dark:text-slate-100">{orderData.invoiceNumber || `#${orderId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Status</span>
              <span className={`font-semibold ${
                orderData.status === 'PAID' || orderData.status === 'COMPLETED' ? 'text-green-600' : 
                orderData.status === 'PENDING' || orderData.status === 'UNPAID' ? 'text-amber-600' : 'text-slate-600'
              }`}>
                {orderData.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="font-semibold dark:text-slate-100">${orderData.subtotal?.toFixed(2) || orderData.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Tax</span>
              <span className="font-semibold dark:text-slate-100">${orderData.taxAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Discount</span>
              <span className="font-semibold text-green-600 dark:text-green-400">-${orderData.discountAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
              <span className="dark:text-slate-100">Total</span>
              <span className="dark:text-slate-100">${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4 dark:text-slate-100">Payment Method</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('CASH')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              paymentMethod === 'CASH' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <DollarSign className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Cash</span>
          </button>
          <button
            onClick={() => setPaymentMethod('KHQR')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              paymentMethod === 'KHQR' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <QrCode className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">KHQR</span>
          </button>
          <button
            onClick={() => setPaymentMethod('CARD')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              paymentMethod === 'CARD' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <CreditCard className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Card</span>
          </button>
          <button
            onClick={() => setPaymentMethod('WALLET')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              paymentMethod === 'WALLET' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Smartphone className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Wallet</span>
          </button>
        </div>
      </Card>

      {paymentMethod === 'CASH' && (
        <Card className="p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4 dark:text-slate-100">Cash Payment</h2>
          <Input
            label="Amount Paid"
            type="number"
            placeholder="Enter amount"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex justify-between text-lg font-bold">
              <span className="dark:text-slate-300">Change Due</span>
              <span className="dark:text-slate-100">${changeDue.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      {paymentMethod === 'KHQR' && (
        <Card className="p-4 mb-4 text-center">
          <h2 className="text-lg font-semibold mb-4 dark:text-slate-100">Scan KHQR Code</h2>
          <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center rounded-lg">
            <QrCode className="h-24 w-24 text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Scan with your banking app to pay</p>
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
        disabled={!amountPaid || parseFloat(amountPaid) < orderTotal}
      >
        Complete Payment
        <CheckCircle className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}