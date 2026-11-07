'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Package, 
  ExternalLink, 
  Copy, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Phone,
  MapPin,
  Send,
  CreditCard,
  Calendar
} from 'lucide-react';

export interface OrderItem {
  id?: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  image?: string;
}

export interface Order {
  id: string;
  telegram_name: string;
  telegram_phone?: string;
  address?: string;
  items?: OrderItem[];
  total_price: number;
  payment_method?: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  telegram_message_id?: number | string;
  created_at: string;
}

interface OrderReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (orderId: string, newStatus: 'approved' | 'rejected') => Promise<void> | void;
}

export default function OrderReceiptModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
}: OrderReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const shortId = order.id.slice(0, 8).toUpperCase();
  const rawTelegram = (order.telegram_name || '').replace(/^@/, '').trim();
  const telegramUrl = rawTelegram ? `https://t.me/${rawTelegram}` : '#';
  const items = order.items || [];

  const handleCopyDetails = () => {
    const text = `🛍️ STARFASHION RECEIPT #${shortId}\n` +
      `Order ID: ${order.id}\n` +
      `Customer: @${rawTelegram}\n` +
      `Phone: ${order.telegram_phone || 'N/A'}\n` +
      `Address: ${order.address || 'N/A'}\n` +
      `Payment: ${order.payment_method || 'COD'}\n` +
      `Status: ${order.status.toUpperCase()}\n` +
      `Total: $${Number(order.total_price).toFixed(2)}\n\n` +
      `Items:\n` +
      items.map((it, idx) => `${idx + 1}. ${it.name} (Size: ${it.size}, Qty: ${it.qty}) - $${(Number(it.price) * it.qty).toFixed(2)}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: 'approved' | 'rejected') => {
    if (!onStatusUpdate) return;
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 shadow-2xl rounded-none text-zinc-100 my-8 overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header Bar */}
        <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
              StarFashion Official Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition rounded hover:bg-zinc-800"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Receipt Brand Banner */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-zinc-800">
            <h2 className="text-2xl font-black tracking-tighter uppercase">STARFASHION</h2>
            <p className="text-[11px] text-zinc-400 uppercase tracking-widest">Luxury Minimalist Streetwear & Apparel</p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="text-xs px-2.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold">
                #{shortId}
              </span>
              <span
                className={`px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                  order.status === 'approved'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : order.status === 'rejected'
                    ? 'bg-red-950/80 text-red-400 border border-red-800'
                    : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                }`}
              >
                {order.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                {order.status === 'rejected' && <XCircle className="w-3 h-3" />}
                {order.status === 'pending' && <Clock className="w-3 h-3" />}
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-900/60 p-4 border border-zinc-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Date & Time</span>
              </div>
              <p className="font-bold text-zinc-200">{formattedDate} at {formattedTime}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                <span>Payment Method</span>
              </div>
              <p className="font-bold text-zinc-200">
                {order.payment_method === 'KHQR' ? '🏦 KHQR Scan (Mobile Bank)' : '💵 Cash on Delivery (COD)'}
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Full System Order ID</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold"
                >
                  <Copy className="w-3 h-3" /> {copied ? 'COPIED!' : 'COPY ID'}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 break-all select-all">{order.id}</p>
            </div>
          </div>

          {/* Customer & Delivery Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <span>Customer Information</span>
            </h3>
            
            <div className="bg-zinc-900/40 p-4 border border-zinc-800 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Telegram:</span>
                  <span className="font-bold text-white">@{rawTelegram || 'None'}</span>
                </div>
                {rawTelegram && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/60 border border-sky-800 text-sky-400 text-[11px] font-bold hover:bg-sky-900 transition w-fit"
                  >
                    <Send className="w-3 h-3" /> Chat on Telegram <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-500">Phone:</span>
                <span className="font-bold text-zinc-200">{order.telegram_phone || 'Not provided'}</span>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Delivery Address:</span>
                  <span className="font-bold text-zinc-200 text-xs leading-relaxed">{order.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Products Itemized List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span>Ordered Products ({items.length})</span>
              <span>Subtotal</span>
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                  No line items found.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 p-3 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover bg-zinc-900 border border-zinc-800 shrink-0 rounded-none"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                          <Package className="w-5 h-5 text-zinc-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Size: <span className="text-zinc-200 font-bold">{item.size}</span> | Qty:{' '}
                          <span className="text-zinc-200 font-bold">{item.qty}</span> × ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white block">
                        ${(Number(item.price) * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing Totals Section */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Items Subtotal</span>
              <span>${Number(order.total_price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Standard Delivery</span>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">FREE</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline text-white">
              <span className="text-sm font-black uppercase tracking-wider">Total Amount</span>
              <span className="text-2xl font-black font-mono tracking-tight">${Number(order.total_price).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="bg-zinc-900 px-6 py-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyDetails}
              className="flex-1 sm:flex-none px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 sm:flex-none px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isUpdating || order.status === 'approved'}
              onClick={() => handleStatusChange('approved')}
              className={`flex-1 sm:flex-none px-4 py-2 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition ${
                order.status === 'approved'
                  ? 'bg-emerald-950 text-emerald-400 opacity-60 cursor-not-allowed border border-emerald-900'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
              }`}
            >
              <Check className="w-4 h-4" /> Approve Order
            </button>
            <button
              type="button"
              disabled={isUpdating || order.status === 'rejected'}
              onClick={() => handleStatusChange('rejected')}
              className={`flex-1 sm:flex-none px-4 py-2 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition ${
                order.status === 'rejected'
                  ? 'bg-red-950 text-red-400 opacity-60 cursor-not-allowed border border-red-900'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
              }`}
            >
              <X className="w-4 h-4" /> Reject Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
