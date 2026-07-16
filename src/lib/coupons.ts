import type { Coupon } from '../types';

export function computeDiscount(coupon: Coupon, subtotal: number, shippingCost: number): { discount: number; shippingDiscount: number } {
  if (subtotal < coupon.min_order) return { discount: 0, shippingDiscount: 0 };

  if (coupon.type === 'percent') {
    return { discount: Math.round((subtotal * coupon.value) / 100), shippingDiscount: 0 };
  }
  if (coupon.type === 'fixed') {
    return { discount: Math.min(coupon.value, subtotal), shippingDiscount: 0 };
  }
  if (coupon.type === 'shipping') {
    const shipDiscount = coupon.value === 0 ? shippingCost : Math.min(coupon.value, shippingCost);
    return { discount: 0, shippingDiscount: shipDiscount };
  }
  return { discount: 0, shippingDiscount: 0 };
}

export function isCouponValid(coupon: Coupon): boolean {
  if (!coupon.is_active) return false;
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return false;
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return false;
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return false;
  return true;
}

export function couponLabel(coupon: Coupon): string {
  if (coupon.type === 'percent') return `ลด ${coupon.value}%`;
  if (coupon.type === 'fixed') return `ลด ฿${coupon.value}`;
  if (coupon.type === 'shipping') return coupon.value === 0 ? 'ส่วนลดค่าจัดส่ง ฟรี' : `ลดค่าจัดส่ง ฿${coupon.value}`;
  return '';
}
