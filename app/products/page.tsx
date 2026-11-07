'use client';

import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { Plus, Trash2, Edit, X, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sizes: string[];
  stock: number;
  is_featured: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('starboy');
  const [imagesInput, setImagesInput] = useState('');
  const [sizesInput, setSizesInput] = useState('S, M, L, XL');
  const [stock, setStock] = useState('10');
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('starboy');
    setImagesInput('');
    setSizesInput('S, M, L, XL');
    setStock('10');
    setIsFeatured(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setDescription(prod.description || '');
    setPrice(prod.price.toString());
    setCategory(prod.category);
    setImagesInput(prod.images.join(', '));
    setSizesInput(prod.sizes.join(', '));
    setStock(prod.stock.toString());
    setIsFeatured(prod.is_featured);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert('Failed to delete product');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const images = imagesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const sizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const productPayload = {
      name,
      description,
      price: parseFloat(price) || 0,
      category,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop'],
      sizes,
      stock: parseInt(stock, 10) || 0,
      is_featured: isFeatured,
    };

    if (editingId) {
      const { error } = await supabaseAdmin.from('products').update(productPayload).eq('id', editingId);
      if (!error) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert('Failed to update product');
      }
    } else {
      const { error } = await supabaseAdmin.from('products').insert([productPayload]);
      if (!error) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert('Failed to create product');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Product Management</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono mt-1">Add, edit, or remove store inventory</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 bg-white text-zinc-950 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:opacity-90 transition shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-xs animate-pulse">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center font-mono text-xs text-zinc-500 uppercase">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">No Image</div>
                  )}
                  {product.is_featured && (
                    <span className="absolute top-3 left-3 bg-white text-zinc-950 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">{product.category}</span>
                  <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                  <p className="font-mono font-bold text-sm">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-zinc-400 font-mono">Stock: {product.stock} | Sizes: {product.sizes.join(', ')}</p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center gap-2 border-t border-zinc-800 mt-4">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2.5 bg-red-950 text-red-400 hover:bg-red-900 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 max-w-xl w-full p-8 border border-zinc-800 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-black uppercase tracking-wider">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
                  >
                    <option value="starboy">Starboy</option>
                    <option value="old_money">Old Money</option>
                    <option value="casual">Casual</option>
                    <option value="streetwear">Streetwear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">Image URLs (comma-separated)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imagesInput}
                  onChange={(e) => setImagesInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Sizes (comma-separated)</label>
                  <input
                    type="text"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-white"
                />
                <label htmlFor="featured" className="text-xs font-bold uppercase tracking-wider">
                  Featured Product on Home
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-zinc-700 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-white text-zinc-950 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition shadow-lg"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
