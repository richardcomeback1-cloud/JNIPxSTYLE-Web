
-- Function to get customer stats with order aggregation in a single query
-- Avoids loading all orders into JS and computing stats client-side
CREATE OR REPLACE FUNCTION get_customer_stats()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  phone text,
  is_admin boolean,
  loyalty_points int,
  addresses jsonb,
  email text,
  order_count bigint,
  total_spent numeric,
  last_order_date timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.phone,
    p.is_admin,
    p.loyalty_points,
    p.addresses,
    COALESCE(au.email, '-') AS email,
    COALESCE(oc.order_count, 0) AS order_count,
    COALESCE(oc.total_spent, 0) AS total_spent,
    oc.last_order_date
  FROM profiles p
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) AS order_count,
      SUM(total) AS total_spent,
      MAX(created_at) AS last_order_date
    FROM orders
    GROUP BY user_id
  ) oc ON oc.user_id = p.user_id
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY COALESCE(oc.total_spent, 0) DESC;
$$;
