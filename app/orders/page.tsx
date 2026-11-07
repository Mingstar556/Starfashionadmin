'use client';

import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { Check, X } from 'lucide-react';

interface Order {
  id: string;
  telegram_name: string;
  telegram_phone: string;
  address: string;
  items: Array<{ name: string; size: string; qty: number; price: number }>;
  total_price: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    const { data, error } = await query;
    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Orders Management</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono mt-1">Review and approve customer orders</p>
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

      {loading ? (
        <div className="py-20 text-center font-mono text-xs animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center font-mono text-xs text-zinc-500 uppercase">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
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

                <div className="pt-2 border-t border-zinc-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Items:</span>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-xs flex justify-between font-mono text-zinc-300">
                      <span>
                        • {item.name} (Size: {item.size}) x{item.qty}
                      </span>
                      <span className="font-bold">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
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
