import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'StarFashion Admin Portal',
  description: 'Protected management dashboard for StarFashion store inventory and orders.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('star_admin_session');
  const isAuthenticated = session?.value === 'authenticated_token_active';

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        {!isAuthenticated ? (
          children
        ) : (
          <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between hidden md:flex">
              <div>
                <div className="p-6 border-b border-zinc-800">
                  <span className="font-mono font-black text-sm uppercase tracking-wider">StarFashion Admin</span>
                </div>
                <nav className="p-4 space-y-1">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <ShoppingCart className="w-4 h-4" /> Orders
                  </Link>
                  <Link
                    href="/products"
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Package className="w-4 h-4" /> Products
                  </Link>
                  <Link
                    href="/store"
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Settings className="w-4 h-4" /> Store Settings
                  </Link>
                </nav>
              </div>

              <div className="p-4 border-t border-zinc-800">
                <form action="/api/logout" method="POST">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-950/30 transition text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </form>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-20 bg-zinc-900 border-b border-zinc-800 px-8 flex items-center justify-between">
                <span className="font-mono font-bold text-sm">Management Console</span>
                <form action="/api/logout" method="POST">
                  <button type="submit" className="text-xs font-bold uppercase tracking-widest text-red-400 md:hidden">
                    Logout
                  </button>
                </form>
              </header>
              <main className="flex-1 p-8 overflow-y-auto">{children}</main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
