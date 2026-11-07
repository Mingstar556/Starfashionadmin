'use client';

import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { Save, Loader2, Check, Send, Bot, ShieldCheck } from 'lucide-react';

export default function AdminStorePage() {
  const [announcement, setAnnouncement] = useState('');
  const [bannersInput, setBannersInput] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(['Starboy', 'Old Money', 'Streetwear', 'Casual']);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('9030995366:AAEHWxM0u8mzNIUnDutvhUOiZYOSPn8OmoY');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const { data, error } = await supabaseAdmin.from('store_settings').select('*').eq('id', 'main').single();
        if (!error && data) {
          setAnnouncement(data.announcement_text || '');
          setBannersInput((data.banner_images || []).join(', '));
          setIsStoreOpen(data.is_store_open ?? true);
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategoriesList(data.categories);
          }
          if (data.admin_telegram_chat_id) setTelegramChatId(data.admin_telegram_chat_id);
          if (data.telegram_bot_token) setTelegramBotToken(data.telegram_bot_token);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categoriesList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('This category already exists!');
      return;
    }
    setCategoriesList((prev) => [...prev, trimmed]);
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categoriesList.length <= 1) {
      alert('You must have at least one category!');
      return;
    }
    setCategoriesList((prev) => prev.filter((c) => c !== catToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const banner_images = bannersInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanCategories = categoriesList.map((c) => c.trim()).filter(Boolean);

    const { error } = await supabaseAdmin
      .from('store_settings')
      .update({
        announcement_text: announcement,
        banner_images,
        categories: cleanCategories.length > 0 ? cleanCategories : ['Starboy', 'Old Money', 'Streetwear', 'Casual'],
        is_store_open: isStoreOpen,
        admin_telegram_chat_id: telegramChatId.trim(),
        telegram_bot_token: telegramBotToken.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'main');

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert('Failed to update store settings');
    }
    setSaving(false);
  };

  const handleSendTestNotification = async () => {
    if (!telegramChatId) {
      alert('Please enter your Telegram Chat ID first or send /start to @Starfastionbot.');
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_notification: true,
          admin_telegram_chat_id: telegramChatId.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult('✅ Test receipt sent successfully! Check your Telegram.');
      } else {
        setTestResult(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Network error: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center font-mono text-xs animate-pulse">Loading store settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Store Settings</h1>
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono mt-1">
          Manage announcements, banners, store status, and Telegram bot alerts
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs font-mono uppercase flex items-center gap-2">
          <Check className="w-4 h-4" /> Store settings successfully updated!
        </div>
      )}

      {/* Telegram Bot Notification Card */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <Bot className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Telegram Order Bot Notifications</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Instant receipts, customer contact buttons, and 1-tap Approve/Reject
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">Bot Username</label>
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm font-mono text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              <span>@Starfastionbot</span>
              <a
                href="https://t.me/Starfastionbot"
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-xs font-bold text-white underline"
              >
                Open in Telegram →
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              Admin Telegram Chat ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. 123456789 (or send /start to @Starfastionbot)"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
              />
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testSending}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition"
              >
                {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test Receipt
              </button>
            </div>
            {testResult && (
              <p className="text-xs font-mono mt-2 text-zinc-300">{testResult}</p>
            )}
            <p className="text-xs text-zinc-500 font-mono mt-2">
              💡 Tip: Send <code>/start</code> to <code>@Starfastionbot</code> on Telegram to automatically connect your chat.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2">Announcement Bar Text</label>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2">
            Hero Banner Image URLs (comma-separated)
          </label>
          <textarea
            rows={4}
            value={bannersInput}
            onChange={(e) => setBannersInput(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
          />
        </div>

        {/* Front Page Categories Management */}
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Storefront Categories (Navigation & Front Page Filters)
            </label>
            <p className="text-xs text-zinc-400 font-mono">
              Add custom categories that appear on the homepage filter tabs and navigation.
            </p>
          </div>

          {/* Add Category Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Y2K Vintage, Summer Drop, Accessories..."
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm font-mono focus:outline-none focus:border-white text-white"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-6 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold uppercase tracking-wider transition shrink-0 shadow"
            >
              + Add Category
            </button>
          </div>

          {/* Current Categories List */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categoriesList.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950 border border-zinc-700 text-xs font-mono font-bold uppercase text-zinc-200 rounded-sm"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-zinc-500 hover:text-red-400 transition ml-1"
                  title="Remove category"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
          <input
            type="checkbox"
            id="storeOpen"
            checked={isStoreOpen}
            onChange={(e) => setIsStoreOpen(e.target.checked)}
            className="w-5 h-5 accent-white"
          />
          <label htmlFor="storeOpen" className="text-xs font-bold uppercase tracking-wider">
            Store is Open for Orders
          </label>
        </div>

        <div className="pt-6 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 bg-white text-zinc-950 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:opacity-95 transition shadow-lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
