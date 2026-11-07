// Robust Universal Supabase/Local DB Client for StarFashion Admin Portal

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isRealSupabaseConfigured =
  Boolean(supabaseUrl) &&
  !supabaseUrl.includes('placeholder') &&
  Boolean(supabaseServiceKey || supabaseAnonKey);

class LocalQueryBuilder {
  table: string;
  queryType: 'select' | 'insert' | 'update' | 'delete' = 'select';
  filters: { column: string; operator: string; value: any }[] = [];
  orderCol: string | null = null;
  ascending: boolean = true;
  singleRow: boolean = false;
  payload: any = null;
  limitCount: number | null = null;

  constructor(table: string, queryType: 'select' | 'insert' | 'update' | 'delete' = 'select') {
    this.table = table;
    this.queryType = queryType;
  }

  select(columns = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderCol = column;
    this.ascending = ascending;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  insert(data: any) {
    this.queryType = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.queryType = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.queryType = 'delete';
    return this;
  }

  async then(resolve: (res: { data: any; error: any }) => void, reject?: (err: any) => void) {
    try {
      if (typeof window !== 'undefined') {
        // Client-side execution via API routes
        if (this.queryType === 'select') {
          let endpoint =
            this.table === 'products'
              ? '/api/products'
              : this.table === 'orders'
              ? '/api/orders'
              : '/api/settings';
          const idFilter = this.filters.find((f) => f.column === 'id' && f.operator === 'eq');
          if (idFilter?.value) {
            endpoint += `?id=${encodeURIComponent(idFilter.value)}`;
          }
          const res = await fetch(endpoint);
          const data = await res.json();
          let results = Array.isArray(data) ? data : data && !data.error ? [data] : [];

          for (const f of this.filters) {
            if (f.operator === 'eq') {
              results = results.filter((item: any) => item[f.column] === f.value);
            } else if (f.operator === 'neq') {
              results = results.filter((item: any) => item[f.column] !== f.value);
            }
          }
          if (this.orderCol) {
            results.sort((a: any, b: any) => {
              const valA = a[this.orderCol!];
              const valB = b[this.orderCol!];
              if (valA < valB) return this.ascending ? -1 : 1;
              if (valA > valB) return this.ascending ? 1 : -1;
              return 0;
            });
          }
          if (this.limitCount !== null) {
            results = results.slice(0, this.limitCount);
          }
          if (this.singleRow) {
            resolve({ data: results[0] || null, error: null });
          } else {
            resolve({ data: results, error: null });
          }
        } else if (this.queryType === 'insert') {
          const endpoint = this.table === 'products' ? '/api/products' : '/api/orders';
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Array.isArray(this.payload) ? this.payload[0] : this.payload),
          });
          const json = await res.json();
          resolve({ data: json.product || json.order || json, error: json.error || null });
        } else if (this.queryType === 'update') {
          const endpoint =
            this.table === 'products'
              ? '/api/products'
              : this.table === 'orders'
              ? '/api/orders'
              : '/api/settings';
          const method = this.table === 'orders' ? 'PATCH' : 'PUT';
          const id = this.filters.find((f) => f.column === 'id')?.value;
          const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...this.payload }),
          });
          const json = await res.json();
          resolve({
            data: json.product || json.order || json.settings || json,
            error: json.error || null,
          });
        } else if (this.queryType === 'delete') {
          const id = this.filters.find((f) => f.column === 'id')?.value;
          const endpoint = `${this.table === 'products' ? '/api/products' : '/api/orders'}?id=${id}`;
          const res = await fetch(endpoint, { method: 'DELETE' });
          const json = await res.json();
          resolve({ data: json, error: json.error || null });
        }
      } else {
        // Server-side execution using local DB
        const { readDB, writeDB } = await import('./db');
        const db = readDB();
        let tableData: any[] = [];
        if (this.table === 'products') tableData = db.products;
        else if (this.table === 'orders') tableData = db.orders;
        else if (this.table === 'store_settings') tableData = [db.store_settings];

        if (this.queryType === 'select') {
          let results = [...tableData];
          for (const f of this.filters) {
            if (f.operator === 'eq') {
              results = results.filter((item: any) => item[f.column] === f.value);
            } else if (f.operator === 'neq') {
              results = results.filter((item: any) => item[f.column] !== f.value);
            }
          }
          if (this.orderCol) {
            results.sort((a: any, b: any) => {
              const valA = a[this.orderCol!];
              const valB = b[this.orderCol!];
              if (valA < valB) return this.ascending ? -1 : 1;
              if (valA > valB) return this.ascending ? 1 : -1;
              return 0;
            });
          }
          if (this.limitCount !== null) {
            results = results.slice(0, this.limitCount);
          }
          if (this.singleRow) {
            resolve({ data: results[0] || null, error: null });
          } else {
            resolve({ data: results, error: null });
          }
        } else if (this.queryType === 'insert') {
          const item = Array.isArray(this.payload) ? this.payload[0] : this.payload;
          const newItem = {
            id: item.id || (this.table === 'products' ? 'prod-' : 'ord-') + Date.now(),
            ...item,
            created_at: new Date().toISOString(),
          };
          if (this.table === 'products') db.products.unshift(newItem);
          else if (this.table === 'orders') db.orders.unshift(newItem);
          writeDB(db);
          resolve({ data: newItem, error: null });
        } else if (this.queryType === 'update') {
          const id = this.filters.find((f) => f.column === 'id')?.value;
          if (this.table === 'products') {
            const idx = db.products.findIndex((p) => p.id === id);
            if (idx !== -1) {
              db.products[idx] = { ...db.products[idx], ...this.payload };
              writeDB(db);
              resolve({ data: db.products[idx], error: null });
              return;
            }
          } else if (this.table === 'orders') {
            const idx = db.orders.findIndex((o) => o.id === id);
            if (idx !== -1) {
              db.orders[idx] = { ...db.orders[idx], ...this.payload };
              writeDB(db);
              resolve({ data: db.orders[idx], error: null });
              return;
            }
          } else if (this.table === 'store_settings') {
            db.store_settings = { ...db.store_settings, ...this.payload };
            writeDB(db);
            resolve({ data: db.store_settings, error: null });
            return;
          }
          resolve({ data: null, error: 'Item not found for update' });
        } else if (this.queryType === 'delete') {
          const id = this.filters.find((f) => f.column === 'id')?.value;
          if (this.table === 'products') {
            db.products = db.products.filter((p) => p.id !== id);
          } else if (this.table === 'orders') {
            db.orders = db.orders.filter((o) => o.id !== id);
          }
          writeDB(db);
          resolve({ data: { success: true }, error: null });
        }
      }
    } catch (err: any) {
      resolve({ data: null, error: err.message });
    }
  }
}

class LocalSupabaseClient {
  from(table: string) {
    return new LocalQueryBuilder(table);
  }
}

export const supabaseAdmin = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : (new LocalSupabaseClient() as any);
