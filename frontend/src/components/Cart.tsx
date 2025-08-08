'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/providers';

export default function Cart({ orderType = 'patient' }: { orderType?: 'patient' | 'stock' }) {
  const { items, patientInfo, updateQuantity, removeItem, totalCents, itemCount, clearCart } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [sendMethod, setSendMethod] = useState<'text' | 'email' | 'direct'>('email');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    // For patient orders, require patient info. For stock orders, use doctor's info
    if (orderType === 'patient' && !patientInfo) {
      alert('Please add patient information before checkout');
      return;
    }

    setIsCreatingOrder(true);
    
    try {
      // Create the order
      console.log('User object:', user);
      console.log('Patient info:', patientInfo);
      
      const payload = {
        orderType: orderType,
        patientName: orderType === 'patient' ? patientInfo?.name : 'Stock Order',
        patientEmail: orderType === 'patient' ? patientInfo?.email : user?.email || 'admin@medportal.com',
        patientPhone: orderType === 'patient' ? patientInfo?.phone : undefined,
        doctorId: user?.sub || null,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };
      
      console.log('Creating order with payload:', payload);

      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.text();
        console.error('Order creation failed:', errorData);
        throw new Error(`Failed to create order: ${errorData}`);
      }

      const order = await orderResponse.json();

      if (orderType === 'stock') {
        // Stock orders are automatically approved and don't need payment
        alert('Stock order created successfully! Inventory has been updated.');
        clearCart();
        router.push('/admin/products');
      } else {
        // Patient orders require payment
        if (sendMethod === 'direct') {
          // Direct payment - navigate to checkout
          const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/link`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await fetch('/api/auth/me').then(r => r.json()).then(d => d.token)}`,
            },
          });

          if (!linkResponse.ok) {
            throw new Error('Failed to generate checkout link');
          }

          const { checkoutUrl } = await linkResponse.json();
          clearCart();
          window.location.href = checkoutUrl;
        } else if (sendMethod === 'email' || sendMethod === 'text') {
          // Send payment link via text or email
          if (sendMethod === 'text' && !patientInfo?.phone) {
            alert('Phone number required for text message');
            return;
          }

          // Send payment link
          const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/send-payment-link`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await fetch('/api/auth/me').then(r => r.json()).then(d => d.token)}`,
            },
            body: JSON.stringify({
              method: sendMethod,
              phone: sendMethod === 'text' ? patientInfo?.phone : undefined,
            }),
          });

          if (!sendResponse.ok) {
            throw new Error('Failed to send payment link');
          }

          const sendResult = await sendResponse.json();
          alert(sendResult.message);
          clearCart();
          router.push('/dashboard');
        } else {
          // Generate link only and show modal to copy
          const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/link`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await fetch('/api/auth/me').then(r => r.json()).then(d => d.token)}`,
            },
          });
          if (!linkResponse.ok) {
            throw new Error('Failed to generate checkout link');
          }
          const { checkoutUrl } = await linkResponse.json();
          setGeneratedLink(checkoutUrl);
          setShowLinkModal(true);
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Cart is empty
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Shopping Cart ({itemCount} items)</h2>
        
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between py-3 border-b">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="text-sm font-medium text-gray-900">
                  ${(item.priceCents / 100).toFixed(2)} each
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
                
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${(totalCents / 100).toFixed(2)}</span>
          </div>
        </div>

        {orderType === 'patient' && patientInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Patient Information</h3>
            <p className="text-sm text-gray-600">Name: {patientInfo.name}</p>
            <p className="text-sm text-gray-600">Email: {patientInfo.email}</p>
            {patientInfo.phone && <p className="text-sm text-gray-600">Phone: {patientInfo.phone}</p>}
          </div>
        )}

        {orderType === 'stock' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📦 Stock Replenishment Order</h3>
            <p className="text-sm text-blue-700">
              This order will add inventory to your medical supplies. No payment required.
            </p>
          </div>
        )}

        {orderType === 'patient' && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sendMethod"
                  value="email"
                  checked={sendMethod === 'email'}
                  onChange={(e) => setSendMethod(e.target.value as any)}
                  className="mr-2"
                />
                Send payment link via email
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sendMethod"
                  value="text"
                  checked={sendMethod === 'text'}
                  onChange={(e) => setSendMethod(e.target.value as any)}
                  className="mr-2"
                />
                Send payment link via text message
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sendMethod"
                  value="link"
                  checked={sendMethod === 'link'}
                  onChange={(e) => setSendMethod(e.target.value as any)}
                  className="mr-2"
                />
                Generate link only
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sendMethod"
                  value="direct"
                  checked={sendMethod === 'direct'}
                  onChange={(e) => setSendMethod(e.target.value as any)}
                  className="mr-2"
                />
                Enter payment details now
              </label>
            </div>
          </div>
        )}

        <button
          onClick={handleCreateOrder}
          disabled={(orderType === 'patient' && !patientInfo) || isCreatingOrder}
          className="w-full mt-6 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingOrder ? 'Creating Order...' : 
           orderType === 'stock' ? 'Order Stock Replenishment' : 'Proceed to Checkout'}
        </button>

        {showLinkModal && generatedLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
              <h3 className="text-lg font-semibold mb-3">Payment Link</h3>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={generatedLink}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert('Link copied to clipboard');
                  }}
                >
                  Copy
                </button>
              </div>
              <div className="mt-4 text-right">
                <button className="btn" onClick={() => setShowLinkModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}