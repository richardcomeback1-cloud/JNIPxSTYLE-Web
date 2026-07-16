/*
# Add shipping type to coupons check constraint

## Overview
The coupons table has a CHECK constraint limiting type to 'percent' and 'fixed'.
We need to add 'shipping' for the new shipping-discount coupons.

## Changes
- Drop the existing check constraint coupons_type_check
- Recreate it with 'shipping' included
- Insert FREESHIP and SHIP50 seed coupons
- Create user_coupons table + RLS (from previous migration that only created the table)
*/

ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_type_check;
ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_type_check
  CHECK (type = ANY (ARRAY['percent'::text, 'fixed'::text, 'shipping'::text]));

-- Seed shipping-discount coupons (idempotent)
INSERT INTO coupons (code, type, value, min_order, max_uses, valid_from, valid_until, is_active)
SELECT 'FREESHIP', 'shipping', 0, 500, null, now(), now() + interval '30 days', true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'FREESHIP');

INSERT INTO coupons (code, type, value, min_order, max_uses, valid_from, valid_until, is_active)
SELECT 'SHIP50', 'shipping', 50, 0, null, now(), now() + interval '30 days', true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'SHIP50');
