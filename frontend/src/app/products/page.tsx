'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import Cart from '@/components/Cart';
import PatientModal from '@/components/PatientModal';
import { useUser } from '@/app/providers';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  const { addItem, setPatientInfo, patientInfo } = useCart();
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
        
        // Initialize quantities
        const initialQuantities: { [key: string]: number } = {};
        data.forEach((product: Product) => {
          initialQuantities[product.id] = 1;
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

  const handleSelectPatient = (patient: { name: string; email: string; phone?: string }) => {
    setPatientInfo({
      name: patient.name,
      email: patient.email,
      phone: patient.phone || undefined,
    });
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
            <h1 className="text-3xl font-bold text-gray-900">Order Products</h1>
            <nav className="flex space-x-4">
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
              <h2 className="text-xl font-semibold text-gray-900">Available Products</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {products.map((product) => (
                <div key={product.id} className="card">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                  <p className="text-2xl font-bold text-primary-600 mt-4">
                    ${(product.priceCents / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Stock: {product.quantity} units
                  </p>
                  {product.expirationDate && (
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(product.expirationDate).toLocaleDateString()}
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
                        max={product.quantity}
                        value={quantities[product.id] || 1}
                        onChange={(e) => setQuantities(prev => ({
                          ...prev,
                          [product.id]: parseInt(e.target.value) || 1
                        }))}
                        className="w-16 text-center border-t border-b border-gray-200"
                      />
                      <button
                        onClick={() => setQuantities(prev => ({
                          ...prev,
                          [product.id]: Math.min(product.quantity, (prev[product.id] || 1) + 1)
                        }))}
                        className="w-8 h-8 rounded-r-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantity === 0}
                      className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No products available at the moment.</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Cart />
              
              {/* Add Patient Info Button */}
              <button
                onClick={() => setShowPatientModal(true)}
                className="w-full btn btn-secondary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {patientInfo ? 'Change Patient' : 'Add Patient Info'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Patient Modal */}
        <PatientModal
          isOpen={showPatientModal}
          onClose={() => setShowPatientModal(false)}
          onSelectPatient={handleSelectPatient}
          currentPatient={patientInfo}
        />
      </main>
    </div>
  );
}