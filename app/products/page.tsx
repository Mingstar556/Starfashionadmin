'use client';

import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { Plus, Trash2, Edit, X, Loader2, Search, UploadCloud, Image as ImageIcon, Star } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('starboy');
  const [imageList, setImageList] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [sizesInput, setSizesInput] = useState('S, M, L, XL');
  const [stock, setStock] = useState('10');
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

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

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('starboy');
    setImageList([]);
    setNewImageUrl('');
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
    setImageList(Array.isArray(prod.images) ? [...prod.images] : []);
    setNewImageUrl('');
    setSizesInput((prod.sizes || []).join(', '));
    setStock(prod.stock.toString());
    setIsFeatured(prod.is_featured);
    setIsModalOpen(true);
  };

  const handleAddUrlImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setImageList((prev) => [...prev, trimmed]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImageList((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const handleMultipleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    const readers: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
      readers.push(promise);
    }

    Promise.all(readers)
      .then((uploadedImages) => {
        setImageList((prev) => [...prev, ...uploadedImages]);
      })
      .finally(() => {
        setIsUploadingFiles(false);
        e.target.value = '';
      });
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

    const validImages = imageList.filter(Boolean);
    const finalImages =
      validImages.length > 0
        ? validImages
        : ['https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop'];

    const sizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const productPayload = {
      name,
      description,
      price: parseFloat(price) || 0,
      category,
      images: finalImages,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Product Management</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono mt-1">Add, edit, or search inventory by Product ID or Name</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 bg-white text-zinc-950 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:opacity-90 transition shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Product Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by Product ID (e.g. SF-7K9A or prod-1), Name, or Category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:border-white text-white rounded-none transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-white"
          >
            CLEAR
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-xs animate-pulse">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center font-mono text-xs text-zinc-500 uppercase">
          {searchQuery ? `No products match "${searchQuery}"` : 'No products found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-zinc-800 flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">No Image</div>
                  )}
                  {product.is_featured && (
                    <span className="absolute top-3 left-3 bg-white text-zinc-950 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 shadow">
                      Featured
                    </span>
                  )}
                  {/* Photo count indicator */}
                  {product.images && product.images.length > 1 && (
                    <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-zinc-300 text-[10px] font-mono font-bold px-2 py-0.5 border border-zinc-700 shadow">
                      📷 {product.images.length} photos
                    </span>
                  )}
                  {/* Short ID Badge on Image */}
                  <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-zinc-200 text-[11px] font-mono font-bold px-2 py-0.5 border border-zinc-700 shadow">
                    ID: {product.id}
                  </span>
                </div>
                <div className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-zinc-400">{product.category}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5">
                        #{product.id}
                      </span>
                    </div>
                  </div>
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

              {/* Multi-Photo Upload & Management Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider">
                    Product Photos ({imageList.length})
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {imageList.length > 0 ? 'First photo is Primary Cover' : 'Upload or add URLs'}
                  </span>
                </div>

                {/* File Upload Box (Supports Multiple Files at once) */}
                <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/70 p-4 text-center transition relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultipleFilesUpload}
                    disabled={isUploadingFiles}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                    <UploadCloud className="w-6 h-6 text-zinc-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      {isUploadingFiles ? 'Processing Photos...' : 'Click or Drop Multiple Photos Here'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      PNG, JPG, WEBP, GIF (Upload 1 or more images together)
                    </span>
                  </div>
                </div>

                {/* Add Photo by URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste an image URL (https://...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrlImage();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 text-xs font-mono focus:outline-none focus:border-white text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-200 shrink-0 transition"
                  >
                    Add URL
                  </button>
                </div>

                {/* Multi-Photo Preview Grid */}
                {imageList.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 bg-zinc-950/50 border border-zinc-800/80 rounded">
                      {imageList.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative aspect-[3/4] bg-zinc-900 border rounded overflow-hidden group/img ${
                            idx === 0 ? 'border-white ring-1 ring-white' : 'border-zinc-800'
                          }`}
                        >
                          <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {/* Primary Cover Badge */}
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-white text-black text-[9px] font-bold uppercase tracking-tight px-1 py-0.5 rounded shadow">
                              Cover
                            </span>
                          )}

                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-between p-1">
                            {idx !== 0 ? (
                              <button
                                type="button"
                                title="Set as primary cover"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="w-full py-0.5 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-mono uppercase text-zinc-200 rounded"
                              >
                                Set Cover
                              </button>
                            ) : (
                              <span className="text-[9px] text-zinc-400 font-mono">Primary</span>
                            )}

                            <button
                              type="button"
                              title="Delete photo"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 bg-red-950 hover:bg-red-900 text-red-300 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Tip: Hover over any photo to set it as Primary Cover or remove it.
                    </p>
                  </div>
                )}
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
