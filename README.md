# StarFashion Admin Dashboard

Standalone administrative management portal for StarFashion e-commerce store.

## Running the Admin App
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env.local` (sharing Supabase and `ADMIN_PASSWORD` with the storefront).
3. Run development server:
   ```bash
   npm run dev -p 3001
   ```
   Open [http://localhost:3001](http://localhost:3001) to manage orders, products, and store settings.
