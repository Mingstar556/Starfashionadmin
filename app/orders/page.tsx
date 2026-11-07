'use client';

import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { Check, X, Package, Search } from 'lucide-react';

interface Order {
  id: string;
  telegram_name: string;
  telegram_phone: string;
  address: string;
  items: Array<{ name: string; size: string; qty: number; price: number; image?: string }>;
  total_price: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [filter]);

  async function fetchOrders(showLoading = false) {
    if (showLoading) setLoading(true);
    let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    const { data, error } = await query;
    if (!error && data) {
      setOrders(data);
    }
    if (showLoading) setLoading(false);
  }

  const updateOrderStatus = async (orderId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabaseAdmin.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
    } else {
      alert('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
    const shortId = order.id.slice(0, 8).toLowerCase();
    const fullId = order.id.toLowerCase();
    const customer = (order.telegram_name || '').toLowerCase().replace(/^@/, '');
    const phone = (order.telegram_phone || '').toLowerCase();
    const itemsMatch = order.items.some((i) => i.name.toLowerCase().includes(q));

    return (
      fullId.includes(q) ||
      shortId.includes(q) ||
      customer.includes(q) ||
      phone.includes(q) ||
      itemsMatch
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Orders Management</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono mt-1">Review, search by Receipt / Order ID, and approve orders</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                filter === status
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Order Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by Order ID / Receipt ID (e.g. #ORD-OLR8 or ord-olr8245yo), customer @username, phone..."
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
        <div className="py-20 text-center font-mono text-xs animate-pulse">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center font-mono text-xs text-zinc-500 uppercase">
          {searchQuery ? `No orders match "${searchQuery}"` : 'No orders found.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-zinc-900 p-6 border border-zinc-800 flex flex-col lg:flex-row justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      order.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300'
                        : order.status === 'rejected'
                        ? 'bg-red-950 text-red-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-zinc-400">
                  <div>
                    <p>
                      <strong className="text-zinc-100">Customer:</strong> @{order.telegram_name}
                    </p>
                    <p>
                      <strong className="text-zinc-100">Phone:</strong> {order.telegram_phone}
                    </p>
                    <p>
                      <strong className="text-zinc-100">Payment:</strong> {order.payment_method}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong className="text-zinc-100">Address:</strong> {order.address}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-500">
                    <span>Ordered Products ({order.items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded bg-zinc-900 border border-zinc-800 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                              <Package className="w-5 h-5 text-zinc-500" />
                            </div>
                          )}
                          <div className="min-w-0 font-mono">
                            <p className="text-xs font-semibold text-zinc-200 truncate">{item.name}</p>
                            <p className="text-[11px] text-zinc-400">
                              Size: <span className="text-zinc-200 font-bold">{item.size}</span> | Qty:{' '}
                              <span className="text-zinc-200 font-bold">{item.qty}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <span className="text-xs font-bold text-zinc-100">
                            ${(item.price * item.qty).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            (${Number(item.price).toFixed(2)} ea)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end border-t lg:border-t-0 lg:border-l border-zinc-800 pt-4 lg:pt-0 lg:pl-6">
                <div className="text-right font-mono mb-4">
                  <span className="text-xs text-zinc-500 block uppercase">Total Amount</span>
                  <span className="text-xl font-bold">${order.total_price.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'approved')}
                    className="flex-1 lg:flex-none px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'rejected')}
                    className="flex-1 lg:flex-none px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
