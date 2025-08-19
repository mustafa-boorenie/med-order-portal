'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Product } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// Stock replenishment will use a simple modal flow (no actual updates)

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({ name: '', sku: '', priceCents: 0, quantity: 0, parLevel: 10 });
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [replenishProductId, setReplenishProductId] = useState<string>('');
  const [replenishQty, setReplenishQty] = useState<number>(10);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const resp = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch {}
  };

  const openReplenish = () => {
    setReplenishProductId(products[0]?.id || '');
    setReplenishQty(10);
    setShowReplenishModal(true);
  };
  const submitReplenish = () => {
    const prod = products.find(p => p.id === replenishProductId);
    const name = prod ? prod.name : 'Selected product';
    alert(`Requested replenishment: ${replenishQty} units of ${name}.`);
    setShowReplenishModal(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sku: '', priceCents: 0, quantity: 0, parLevel: 10 });
    setShowModal(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setShowModal(true);
  };
  const saveProduct = async () => {
    const payload = {
      name: form.name,
      sku: form.sku,
      priceCents: Number(form.priceCents) || 0,
      quantity: Number(form.quantity) || 0,
      parLevel: Number(form.parLevel) || 10,
      expirationDate: form.expirationDate || undefined,
    } as any;
    const resp = await fetch(editing ? `/api/admin/products/${editing.id}` : '/api/admin/products', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      // refresh list
      const list = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`).then(r => r.json());
      setProducts(list);
      setShowModal(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-3xl font-bold text-gray-900">Manage Stock</h1>
            <div className="flex space-x-4">

              <button onClick={openReplenish} className="btn btn-secondary">
                + Order
              </button>
              <button onClick={openCreate} className="btn btn-primary">
                + Product
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.expirationDate && (
                            <div className="text-sm text-gray-500">
                              Expires: {new Date(product.expirationDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(product.priceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.quantity} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.quantity < product.parLevel ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-neutral-200 text-black">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-black">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button onClick={() => openEdit(product)} className="text-primary-600 hover:text-primary-900" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="text-black hover:opacity-70"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Replenishment is handled via modal */}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input className="w-full border rounded px-3 py-2" value={form.name as any} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">SKU</label>
                <input className="w-full border rounded px-3 py-2" value={form.sku as any} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Price (USD)</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={Number(form.priceCents) / 100} onChange={(e) => setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value || '0') * 100) })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.quantity as any} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value || '0') })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Par Level</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.parLevel as any} onChange={(e) => setForm({ ...form, parLevel: parseInt(e.target.value || '10') })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Expiration</label>
                <input type="date" className="w-full border rounded px-3 py-2" value={form.expirationDate ? String(form.expirationDate).substring(0,10) : ''} onChange={(e) => setForm({ ...form, expirationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn">Cancel</button>
              <button onClick={saveProduct} className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {showReplenishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Order Supplies</h3>
              <button onClick={() => setShowReplenishModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Product</label>
                <select className="w-full border rounded px-3 py-2" value={replenishProductId} onChange={(e) => setReplenishProductId(e.target.value)}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                <input type="number" min={1} className="w-full border rounded px-3 py-2" value={replenishQty} onChange={(e) => setReplenishQty(parseInt(e.target.value || '1'))} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowReplenishModal(false)} className="btn">Cancel</button>
              <button onClick={submitReplenish} className="btn btn-primary">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}