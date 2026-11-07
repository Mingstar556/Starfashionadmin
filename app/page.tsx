'use client';

import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { ShoppingCart, Clock, DollarSign, ArrowUpRight, Search } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  telegram_name: string;
  total_price: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchOrders(showLoading = false) {
      if (showLoading) setLoading(true);
      const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setOrders(data);
      }
      if (showLoading) setLoading(false);
    }
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
      (o.telegram_name || '').toLowerCase().includes(q)
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
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Quick search by Order ID / Receipt ID or customer</p>
          </div>
          <Link href="/orders" className="text-xs font-bold uppercase tracking-wider underline flex items-center gap-1 shrink-0">
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dashboard Quick Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Quick search by Order / Receipt ID (e.g. #ORD-OLR8 or ord-olr8245yo)..."
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
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Telegram</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-mono text-xs">
                {filteredOrders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/50">
                    <td className="p-4 font-bold">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4">@{order.telegram_name}</td>
                    <td className="p-4 font-bold">${order.total_price.toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          order.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300'
                            : order.status === 'rejected'
                            ? 'bg-red-950 text-red-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
