/*
# User Coupons (Save to Account) + Shipping Discount Coupons

## Overview
Adds a `user_coupons` junction table so customers can save coupons to their
account and redeem them at checkout. Also adds two shipping-discount coupons
to the existing `coupons` table.

## New Table: user_coupons
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users, NOT NULL, DEFAULT auth.uid())
- `coupon_id` (uuid, FK -> coupons, NOT NULL)
- `saved_at` (timestamptz, default now())
- `used_at` (timestamptz, nullable — set when redeemed)
- `order_id` (uuid, FK -> orders, nullable — links to the order that used it)
- UNIQUE(user_id, coupon_id) — a user can save each coupon only once

## RLS on user_coupons
- Enable RLS
- SELECT/INSERT/UPDATE/DELETE scoped to authenticated, ownership via auth.uid()
- INSERT default user_id = auth.uid()

## Seed Data
- FREESHIP: type='shipping', value=0 (free shipping), min_order=500, valid 30 days
- SHIP50: type='shipping', value=50 (50 baht off shipping), min_order=0, valid 30 days

## Security
- RLS enabled with 4 separate policies (select/insert/update/delete)
- Ownership checks via auth.uid() = user_id
- user_id defaults to auth.uid() so inserts from the client work without passing it
*/
