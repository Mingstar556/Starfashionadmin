import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, Product } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const db = readDB();

    if (id) {
      const product = db.products.find((p) => p.id === id);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json(product);
    }

    return NextResponse.json(db.products);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDB();

    const items = Array.isArray(body) ? body : [body];
    const created: Product[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const newProduct: Product = {
        id: item.id || 'prod-' + (Date.now() + i),
        name: item.name || 'New Product',
        description: item.description || '',
        price: Number(item.price) || 0,
        cost_price: Number(item.cost_price) || Number(item.price) * 0.5 || 0,
        category: item.category || 'streetwear',
        images: item.images || ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop'],
        sizes: item.sizes || ['S', 'M', 'L', 'XL'],
        stock: Number(item.stock) || 10,
        is_featured: Boolean(item.is_featured),
        created_at: new Date().toISOString(),
      };
      db.products.unshift(newProduct);
      created.push(newProduct);
    }

    writeDB(db);
    return NextResponse.json({ success: true, count: created.length, product: created[0], products: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDB();
    const index = db.products.findIndex((p) => p.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    db.products[index] = {
      ...db.products[index],
      ...body,
      price: Number(body.price) ?? db.products[index].price,
      cost_price: Number(body.cost_price) ?? db.products[index].cost_price,
      stock: Number(body.stock) ?? db.products[index].stock,
    };

    writeDB(db);
    return NextResponse.json({ success: true, product: db.products[index] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

    const db = readDB();
    db.products = db.products.filter((p) => p.id !== id);
    writeDB(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
