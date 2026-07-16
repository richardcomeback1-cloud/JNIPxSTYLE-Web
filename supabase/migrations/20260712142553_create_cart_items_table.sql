/*
# Create cart_items table for per-account cart persistence

1. New Tables
- `cart_items`: stores individual cart line items per authenticated user
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `product_id` (uuid, not null, references products)
  - `name` (text, not null) — product name snapshot
  - `slug` (text, not null) — product slug snapshot
  - `price` (numeric, not null) — unit price snapshot
  - `image` (text) — product image URL snapshot
  - `size` (text, not null)
  - `color` (text, not null)
  - `quantity` (integer, not null, default 1)
  - `stock` (integer, not null, default 0) — stock snapshot for max quantity validation
  - `created_at` (timestamptz, default now())
  - Unique constraint on (user_id, product_id, size, color) to prevent duplicate line items

2. Security
- Enable RLS on `cart_items`.
- Owner-scoped CRUD: each authenticated user can only access their own cart rows.
- SELECT, INSERT, UPDATE, DELETE policies scoped to `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so inserts from the client work without passing user_id.
*/

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  price numeric NOT NULL,
  image text DEFAULT '',
  size text NOT NULL,
  color text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: one line item per (user, product, size, color)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_user_product_size_color_key'
  ) THEN
    ALTER TABLE public.cart_items
      ADD CONSTRAINT cart_items_user_product_size_color_key
      UNIQUE (user_id, product_id, size, color);
  END IF;
END $$;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cart_items" ON public.cart_items;
CREATE POLICY "select_own_cart_items"
ON public.cart_items FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cart_items" ON public.cart_items;
CREATE POLICY "insert_own_cart_items"
ON public.cart_items FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cart_items" ON public.cart_items;
CREATE POLICY "update_own_cart_items"
ON public.cart_items FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cart_items" ON public.cart_items;
CREATE POLICY "delete_own_cart_items"
ON public.cart_items FOR DELETE
TO authenticated USING (auth.uid() = user_id);
