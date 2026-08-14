'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
        <p className="text-slate-600">Review your items before checkout</p>
      </div>

      <Card className="p-4 mb-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Your cart is empty</p>
            <Button className="mt-4" onClick={() => window.location.href = '/pos/sell'}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-slate-600">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold">{item.quantity}</span>
                  <button className="p-2 hover:bg-slate-100 rounded">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  <button className="text-red-600 hover:text-red-800 mt-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {cartItems.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tax</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>$0.00</span>
            </div>
          </div>
          <Button className="w-full">
            Proceed to Checkout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      )}
    </div>
  );
}