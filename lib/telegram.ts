import dns from 'node:dns';
import net from 'node:net';
try {
  dns.setDefaultResultOrder?.('ipv4first');
  net.setDefaultAutoSelectFamily?.(false);
} catch {}

import { readDB, writeDB } from './db';

export const DEFAULT_BOT_TOKEN = '9030995366:AAEHWxM0u8mzNIUnDutvhUOiZYOSPn8OmoY';

export function getTelegramConfig() {
  let chatId = process.env.TELEGRAM_CHAT_ID || '';
  let botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;

  try {
    const db = readDB();
    if (!chatId && db.store_settings?.admin_telegram_chat_id) {
      chatId = db.store_settings.admin_telegram_chat_id;
    }
    if (!botToken && db.store_settings?.telegram_bot_token) {
      botToken = db.store_settings.telegram_bot_token;
    }
  } catch (err) {
    console.error('Error reading telegram config from DB:', err);
  }

  return { botToken, chatId };
}

export function saveAdminTelegramChatId(chatId: string | number, username?: string) {
  try {
    const db = readDB();
    if (!db.store_settings) {
      db.store_settings = {
        id: 'main',
        banner_images: [],
        announcement_text: '',
        is_store_open: true,
      };
    }
    db.store_settings.admin_telegram_chat_id = String(chatId);
    writeDB(db);
    console.log(`[Telegram] Saved Admin Chat ID: ${chatId} (${username || 'unknown'}) to database.`);
    return true;
  } catch (err) {
    console.error('Error saving admin telegram chat id:', err);
    return false;
  }
}

export async function sendTelegramOrderNotification(order: {
  id: string;
  telegram_name: string;
  telegram_phone: string;
  address: string;
  items: Array<{ name: string; size: string; qty: number; price: number; image?: string }>;
  total_price: number;
  payment_method: string;
}) {
  const { botToken, chatId } = getTelegramConfig();

  if (!botToken || !chatId) {
    console.warn(`[Telegram] Skipping notification: botToken=${botToken ? 'SET' : 'MISSING'}, chatId=${chatId ? 'SET' : 'MISSING'}. Send /start to @Starfastionbot or set TELEGRAM_CHAT_ID.`);
    return null;
  }

  const cleanUsername = order.telegram_name.replace(/^@/, '').trim();
  const cleanPhone = order.telegram_phone.trim();
  const shortId = order.id.slice(0, 8).toUpperCase();

  const { escapeTelegramMarkdown } = await import('./security').catch(() => ({
    escapeTelegramMarkdown: (s: string) => s.replace(/([_*`\[\]])/g, '\\$1'),
  }));

  const safeUsername = escapeTelegramMarkdown(cleanUsername);
  const safePhone = escapeTelegramMarkdown(cleanPhone);
  const safeAddress = escapeTelegramMarkdown(order.address);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const itemsText = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${escapeTelegramMarkdown(item.name)}*\n   📏 Size: \`${escapeTelegramMarkdown(item.size)}\` | 🔢 Qty: \`${item.qty}\` | 💵 \`$${(item.price * item.qty).toFixed(2)}\``
    )
    .join('\n');

  const paymentLabel = order.payment_method === 'KHQR' ? '🏦 KHQR Scan (Mobile Bank)' : '💵 Cash on Delivery (COD)';

  const message = `🛍️ *NEW STARFASHION ORDER RECEIPT*
🔖 *Order ID:* \`#${shortId}\`
📅 *Date:* ${dateStr} at ${timeStr}

━━━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER CONTACT INFORMATION*
• *Telegram Username:* @${safeUsername}
• *Phone Number:* \`${safePhone}\`
• *Delivery Address:*
  📍 ${safeAddress}

━━━━━━━━━━━━━━━━━━━━━
📦 *ORDERED ITEMS (${order.items.length})*
${itemsText}

━━━━━━━━━━━━━━━━━━━━━
💳 *Payment Method:* ${paymentLabel}
💰 *Total Amount:* *$${order.total_price.toFixed(2)}*
⚡ *Status:* ⏳ *PENDING APPROVAL*

━━━━━━━━━━━━━━━━━━━━━
👇 *ACTIONS FOR ADMIN:*`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: `💬 Chat with @${cleanUsername}`, url: `https://t.me/${cleanUsername}` },
        { text: `📞 Call Customer`, url: `tel:${cleanPhone}` },
      ],
      [
        { text: '✅ Approve Order', callback_data: `approve_${order.id}` },
        { text: '❌ Reject Order', callback_data: `reject_${order.id}` },
      ],
    ],
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard,
      }),
    });

    const data = await response.json();
    if (data.ok && data.result) {
      console.log(`[Telegram] Order receipt #${shortId} sent successfully to chat ${chatId}!`);
      return data.result.message_id as number;
    } else {
      console.error('[Telegram] API error:', data);
      return null;
    }
  } catch (error) {
    console.error('[Telegram] Failed to send order notification:', error);
    return null;
  }
}

export async function editTelegramMessageStatus(
  messageId: number,
  newText: string,
  chatIdOverride?: string | number,
  customerUsername?: string
) {
  const { botToken, chatId } = getTelegramConfig();
  const targetChatId = chatIdOverride || chatId;

  if (!botToken || !targetChatId || !messageId) return false;

  const buttons = [];
  if (customerUsername) {
    const cleanUser = customerUsername.replace(/^@/, '').trim();
    buttons.push([{ text: `💬 Chat with @${cleanUser}`, url: `https://t.me/${cleanUser}` }]);
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        message_id: messageId,
        text: newText,
        parse_mode: 'Markdown',
        reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
      }),
    });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('[Telegram] Failed to edit message status:', error);
    return false;
  }
}

export async function sendTelegramTextMessage(chatId: string | number, text: string) {
  const { botToken } = getTelegramConfig();
  if (!botToken || !chatId) return null;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('[Telegram] Failed to send text message:', error);
    return null;
  }
}

export async function sendTestReceiptNotification(targetChatId?: string | number) {
  const { chatId } = getTelegramConfig();
  const effectiveChatId = targetChatId || chatId;
  if (!effectiveChatId) return { ok: false, error: 'No Chat ID provided' };

  if (targetChatId) {
    saveAdminTelegramChatId(targetChatId);
  }

  const testOrder = {
    id: 'TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    telegram_name: 'starfashion_customer',
    telegram_phone: '+855 12 345 678',
    address: 'Preah Norodom Blvd, Phnom Penh, Cambodia',
    items: [
      { name: 'Starboy Leather Biker Jacket', size: 'L', qty: 1, price: 320 },
      { name: 'Tailored Wide-Leg Trousers', size: 'M', qty: 1, price: 145 },
    ],
    total_price: 465,
    payment_method: 'KHQR',
  };

  const res = await sendTelegramOrderNotification(testOrder);
  return { ok: Boolean(res), result: res };
}
