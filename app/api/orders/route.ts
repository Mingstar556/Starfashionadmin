import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const db = readDB();

    if (id) {
      const order = db.orders.find((o) => o.id === id);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      return NextResponse.json(order);
    }

    return NextResponse.json(db.orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, tracking_number, shipping_carrier, shipping_status } = body;
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

    const db = readDB();
    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    db.orders[index] = {
      ...db.orders[index],
      ...(status && { status }),
      ...(tracking_number !== undefined && { tracking_number }),
      ...(shipping_carrier !== undefined && { shipping_carrier }),
      ...(shipping_status !== undefined && { shipping_status }),
    };

    writeDB(db);
    return NextResponse.json({ success: true, order: db.orders[index] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
