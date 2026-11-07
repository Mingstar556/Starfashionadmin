import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendTestReceiptNotification, getTelegramConfig } from '@/lib/telegram';

export async function GET() {
  try {
    const db = readDB();
    const config = getTelegramConfig();
    return NextResponse.json({
      ...db.store_settings,
      admin_telegram_chat_id: config.chatId || db.store_settings?.admin_telegram_chat_id || '',
      telegram_bot_token: config.botToken || db.store_settings?.telegram_bot_token || '',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if test notification was requested
    if (body.test_notification) {
      const chatId = body.admin_telegram_chat_id;
      const res = await sendTestReceiptNotification(chatId);
      return NextResponse.json(res);
    }

    const db = readDB();
    db.store_settings = {
      ...db.store_settings,
      ...body,
      updated_at: new Date().toISOString(),
    };

    writeDB(db);
    return NextResponse.json({ success: true, settings: db.store_settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
