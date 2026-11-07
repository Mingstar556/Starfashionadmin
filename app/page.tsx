'use client';

import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { ShoppingCart, Clock, DollarSign, ArrowUpRight, Search, Receipt, Eye } from 'lucide-react';
import Link from 'next/link';
import OrderReceiptModal, { Order } from '@/components/OrderReceiptModal';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchOrders(showLoading = false) {
      if (showLoading) setLoading(true);
      const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setOrders(data);
        // If an order is currently selected in modal, keep its state updated live
        setSelectedOrder((prev) => {
          if (!prev) return null;
          const updated = data.find((o: Order) => o.id === prev.id);
          return updated || prev;
        });
      }
      if (showLoading) setLoading(false);
    }
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabaseAdmin.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } else {
      alert('Failed to update order status');
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status === 'approved')
    .reduce((sum, o) => sum + o.total_price, 0);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  ).length;

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
    return (
      o.id.toLowerCase().includes(q) ||
      o.id.slice(0, 8).toLowerCase().includes(q) ||
      (o.telegram_name || '').toLowerCase().includes(q) ||
      (o.telegram_phone || '').toLowerCase().includes(q) ||
      (o.address || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono mt-1">Standalone StarFashion Management Console</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono">${totalRevenue.toFixed(2)}</div>
        </div>

        <div className="bg-zinc-900 p-6 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">Pending Orders</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono">{pendingCount}</div>
        </div>

        <div className="bg-zinc-900 p-6 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest">Today's Orders</span>
            <ShoppingCart className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black font-mono">{todayOrders}</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Recent Orders</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Click any order to open full interactive receipt</p>
          </div>
          <Link href="/orders" className="text-xs font-bold uppercase tracking-wider underline flex items-center gap-1 shrink-0">
            View All Orders <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dashboard Quick Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Quick search by Order / Receipt ID (e.g. #ORD-RGWB or ord-rgwb7fyp7), @username, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 text-xs font-mono placeholder:text-zinc-500 focus:outline-none focus:border-white text-white rounded-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 hover:text-white"
            >
              CLEAR
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono animate-pulse">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 uppercase font-mono">
            {searchQuery ? `No orders match "${searchQuery}"` : 'No orders found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-xs font-mono uppercase text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="p-4">Receipt / Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-mono text-xs">
                {filteredOrders.slice(0, 10).map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-zinc-800/70 transition cursor-pointer group"
                    title="Click to open full order receipt"
                  >
                    <td className="p-4 font-bold text-white group-hover:underline flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 text-zinc-300">@{order.telegram_name || 'Guest'}</td>
                    <td className="p-4 font-bold text-white">${Number(order.total_price).toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest inline-block ${
                          order.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : order.status === 'rejected'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-300 font-bold uppercase text-[10px] tracking-wider transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Order Receipt Modal Popup */}
      <OrderReceiptModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdate={updateOrderStatus}
      />
    </div>
  );
}
