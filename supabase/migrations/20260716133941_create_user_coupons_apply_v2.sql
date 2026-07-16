/*
# Create user_coupons table

## Overview
Junction table so customers can save coupons to their account and redeem
them at checkout. Each user can save each coupon once. When redeemed,
used_at and order_id are set to mark it consumed.

## New Table: user_coupons
- id (uuid PK)
- user_id (uuid FK auth.users, NOT NULL, DEFAULT auth.uid())
- coupon_id (uuid FK coupons, NOT NULL)
- saved_at (timestamptz default now())
- used_at (timestamptz nullable — set when redeemed)
- order_id (uuid FK orders nullable — links to order that used it)
- UNIQUE(user_id, coupon_id)

## RLS
- 4 policies scoped to authenticated, ownership via auth.uid()
- user_id defaults to auth.uid()
*/

CREATE TABLE IF NOT EXISTS user_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE(user_id, coupon_id)
);

ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_coupons" ON user_coupons;
CREATE POLICY "select_own_user_coupons"
  ON user_coupons FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_coupons" ON user_coupons;
CREATE POLICY "insert_own_user_coupons"
  ON user_coupons FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_coupons" ON user_coupons;
CREATE POLICY "update_own_user_coupons"
  ON user_coupons FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_coupons" ON user_coupons;
CREATE POLICY "delete_own_user_coupons"
  ON user_coupons FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
