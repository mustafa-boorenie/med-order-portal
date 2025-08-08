'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import Cart from '@/components/Cart';
import { useUser } from '@/app/providers';
import { useRouter } from 'next/navigation';

export default function StockOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  
  const { addItem } = useCart();
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();

  // Redirect if not authenticated or not admin/doctor
  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'doctor'].includes(user.role))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
        
        // Initialize quantities with suggested reorder amounts
        const initialQuantities: { [key: string]: number } = {};
        data.forEach((product: Product) => {
          // Calculate suggested reorder quantity (difference between par level and current stock)
          const suggestedQty = Math.max(0, product.parLevel - product.quantity);
          initialQuantities[product.id] = suggestedQty > 0 ? suggestedQty : 10; // Default to 10 if not low
        });
        setQuantities(initialQuantities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      priceCents: product.priceCents,
    }, quantity);
    
    // Reset quantity
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return { status: 'out', color: 'red', text: 'Out of Stock' };
    } else if (product.quantity < product.parLevel) {
      return { status: 'low', color: 'yellow', text: 'Low Stock' };
    } else {
      return { status: 'good', color: 'green', text: 'In Stock' };
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">📦 Stock Replenishment</h1>
            <nav className="flex space-x-4">
              <a href="/admin/products" className="btn btn-secondary">
                Product Management
              </a>
              <a href="/dashboard" className="btn btn-secondary">
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Inventory Management</h2>
              <p className="text-gray-600">Order supplies to replenish your medical inventory. Low stock items are highlighted.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <div key={product.id} className={`card border-l-4 ${
                    stockStatus.status === 'out' ? 'border-red-500 bg-red-50' :
                    stockStatus.status === 'low' ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stockStatus.status === 'out' ? 'bg-red-100 text-red-800' :
                        stockStatus.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {stockStatus.text}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                    <p className="text-2xl font-bold text-primary-600 mt-4">
                      ${(product.priceCents / 100).toFixed(2)} each
                    </p>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className={`font-medium ${
                          stockStatus.status === 'out' ? 'text-red-600' :
                          stockStatus.status === 'low' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {product.quantity} units
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Par Level:</span>
                        <span className="font-medium">{product.parLevel} units</span>
                      </div>
                      {product.quantity < product.parLevel && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Suggested Order:</span>
                          <span className="font-medium text-blue-600">
                            {product.parLevel - product.quantity} units
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {product.expirationDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        Next Expiry: {new Date(product.expirationDate).toLocaleDateString()}
                      </p>
                    )}
                    
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex items-center">
                        <button
                          onClick={() => setQuantities(prev => ({
                            ...prev,
                            [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                          }))}
                          className="w-8 h-8 rounded-l-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantities[product.id] || 1}
                          onChange={(e) => setQuantities(prev => ({
                            ...prev,
                            [product.id]: parseInt(e.target.value) || 1
                          }))}
                          className="w-20 text-center border-t border-b border-gray-200"
                        />
                        <button
                          onClick={() => setQuantities(prev => ({
                            ...prev,
                            [product.id]: (prev[product.id] || 1) + 1
                          }))}
                          className="w-8 h-8 rounded-r-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 btn btn-primary"
                      >
                        Add to Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No products available for ordering.</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Cart orderType="stock" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}