/**
 * Central category + dynamic filter configuration.
 *
 * Real categories come from the DB (4 main categories). Shortcut categories
 * (new-arrivals, best-sellers, on-sale) are query-only — they cross-cut
 * categories via product flags, not a real category_id.
 *
 * Filter groups: "common" applies to every category; each category can add
 * "specific" groups. Adding a new category only requires a new entry here —
 * the ShopPage filter sidebar reads from this config.
 */

export interface CategoryMeta {
  name: string;
  slug: string;
  /** sub-category labels shown as quick chips under the category */
  subCategories: string[];
  /** shortcut categories are not real DB categories — they query product flags */
  isShortcut?: boolean;
  /** for shortcuts: the product flag/field to filter on */
  shortcutFilter?: 'is_new' | 'is_sale' | 'best_sellers';
}

export const CATEGORIES: CategoryMeta[] = [
  {
    name: 'นักศึกษาหญิง',
    slug: 'female-uniform',
    subCategories: ['เสื้อ', 'กระโปรง', 'กางเกง', 'ชุดพละ', 'รองเท้า', 'ถุงเท้า', 'อุปกรณ์'],
  },
  {
    name: 'นักศึกษาชาย',
    slug: 'university-uniform-boy',
    subCategories: ['เสื้อ', 'กางเกง', 'ชุดพละ', 'รองเท้า', 'ถุงเท้า', 'อุปกรณ์'],
  },
  {
    name: 'ยูนิเซ็กซ์',
    slug: 'unisex',
    subCategories: ['กระเป๋า', 'หมวก', 'ของใช้ทั่วไป'],
  },
  {
    name: 'ชุดครุย/ชุดพิธีการ',
    slug: 'graduation-formal',
    subCategories: ['ชุดครุย', 'เสื้อเชิ้ต', 'เนกไท', 'รองเท้า'],
  },
];

export const SHORTCUT_CATEGORIES: CategoryMeta[] = [
  {
    name: 'สินค้าใหม่',
    slug: 'new-arrivals',
    subCategories: [],
    isShortcut: true,
    shortcutFilter: 'is_new',
  },
  {
    name: 'สินค้าขายดี',
    slug: 'best-sellers',
    subCategories: [],
    isShortcut: true,
    shortcutFilter: 'best_sellers',
  },
  {
    name: 'สินค้าลดราคา',
    slug: 'on-sale',
    subCategories: [],
    isShortcut: true,
    shortcutFilter: 'is_sale',
  },
];

export const ALL_CATEGORY_SLUGS = [...CATEGORIES.map((c) => c.slug), ...SHORTCUT_CATEGORIES.map((c) => c.slug)];

export function getCategoryMeta(slug: string): CategoryMeta | undefined {
  return [...CATEGORIES, ...SHORTCUT_CATEGORIES].find((c) => c.slug === slug);
}

export function isShortcutSlug(slug: string): boolean {
  return SHORTCUT_CATEGORIES.some((c) => c.slug === slug);
}

// ============================================================
// Dynamic filter configuration
// ============================================================

export type FilterControlType = 'checkbox' | 'chip' | 'range' | 'radio';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  type: FilterControlType;
  options: FilterOption[];
  /** for range type: [min, max] */
  range?: [number, number];
  /** which sub-categories this filter group appears on; empty = all sub-categories */
  applicableSubCats?: string[];
}

/** Common filters shown on every category page */
export const COMMON_FILTERS: FilterGroup[] = [
  {
    key: 'color',
    label: 'สี',
    type: 'checkbox',
    options: [
      { label: 'ขาว', value: 'ขาว' },
      { label: 'ดำ', value: 'ดำ' },
      { label: 'น้ำเงิน', value: 'น้ำเงิน' },
      { label: 'เทา', value: 'เทา' },
      { label: 'ครีม', value: 'ครีม' },
      { label: 'ชมพู', value: 'ชมพู' },
      { label: 'น้ำตาล', value: 'น้ำตาล' },
    ],
  },
  {
    key: 'price',
    label: 'ช่วงราคา',
    type: 'range',
    options: [],
    range: [0, 3000],
  },
  {
    key: 'stock_status',
    label: 'สถานะสินค้า',
    type: 'radio',
    options: [
      { label: 'ทั้งหมด', value: 'all' },
      { label: 'พร้อมส่ง', value: 'in_stock' },
      { label: 'พรีออเดอร์', value: 'preorder' },
    ],
  },
  {
    key: 'rating',
    label: 'คะแนนรีวิว',
    type: 'radio',
    options: [
      { label: 'ทั้งหมด', value: '0' },
      { label: '4 ดาวขึ้นไป', value: '4' },
      { label: '3 ดาวขึ้นไป', value: '3' },
    ],
  },
];

/** Category-specific filters keyed by category slug */
export const CATEGORY_FILTERS: Record<string, FilterGroup[]> = {
  'female-uniform': [
    {
      key: 'collar',
      label: 'ประเภทคอ',
      type: 'checkbox',
      options: [
        { label: 'คอปก', value: 'คอปก' },
        { label: 'คอจีน', value: 'คอจีน' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'sleeve',
      label: 'แขน',
      type: 'checkbox',
      options: [
        { label: 'แขนสั้น', value: 'สั้น' },
        { label: 'แขนยาว', value: 'ยาว' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'fit',
      label: 'ทรง',
      type: 'checkbox',
      options: [
        { label: 'เข้ารูป', value: 'เข้ารูป' },
        { label: 'มาตรฐาน', value: 'มาตรฐาน' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'fabric',
      label: 'เนื้อผ้า',
      type: 'checkbox',
      options: [
        { label: 'คอตตอน', value: 'คอตตอน' },
        { label: 'โพลีเอสเตอร์', value: 'โพลีเอสเตอร์' },
        { label: 'ผ้าผสม', value: 'ผ้าผสม' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'shirt_size',
      label: 'ไซซ์',
      type: 'chip',
      options: [
        { label: 'XS', value: 'XS' },
        { label: 'S', value: 'S' },
        { label: 'M', value: 'M' },
        { label: 'L', value: 'L' },
        { label: 'XL', value: 'XL' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'pant_fit',
      label: 'ทรงกางเกง',
      type: 'checkbox',
      options: [
        { label: 'กระบอก', value: 'กระบอก' },
        { label: 'กระบอกเล็ก', value: 'กระบอกเล็ก' },
        { label: 'ตรง', value: 'ตรง' },
        { label: 'เดฟ', value: 'เดฟ' },
        { label: 'ขาม้า', value: 'ขาม้า' },
        { label: 'ขากว้าง', value: 'ขากว้าง' },
      ],
      applicableSubCats: ['กางเกง', 'กระโปรง'],
    },
    {
      key: 'waist',
      label: 'เอว',
      type: 'checkbox',
      options: [
        { label: 'เอวสูง', value: 'สูง' },
        { label: 'เอวกลาง', value: 'กลาง' },
        { label: 'เอวต่ำ', value: 'ต่ำ' },
      ],
      applicableSubCats: ['กางเกง', 'กระโปรง'],
    },
    {
      key: 'inseam',
      label: 'ความยาวขา',
      type: 'checkbox',
      options: [
        { label: 'สั้น', value: 'สั้น' },
        { label: 'ปกติ', value: 'ปกติ' },
        { label: 'ยาว', value: 'ยาว' },
      ],
      applicableSubCats: ['กางเกง'],
    },
    {
      key: 'pants_size_num',
      label: 'ไซซ์',
      type: 'chip',
      options: [
        { label: '24', value: '24' },
        { label: '25', value: '25' },
        { label: '26', value: '26' },
        { label: '27', value: '27' },
        { label: '28', value: '28' },
        { label: '29', value: '29' },
        { label: '30', value: '30' },
        { label: '32', value: '32' },
        { label: '34', value: '34' },
        { label: '36', value: '36' },
        { label: '38', value: '38' },
      ],
      applicableSubCats: ['กางเกง', 'กระโปรง'],
    },
    {
      key: 'shoe_size',
      label: 'ไซซ์รองเท้า',
      type: 'chip',
      options: Array.from({ length: 9 }, (_, i) => {
        const v = String(36 + i);
        return { label: v, value: v };
      }),
      applicableSubCats: ['รองเท้า'],
    },
    {
      key: 'shoe_type',
      label: 'ประเภทรองเท้า',
      type: 'checkbox',
      options: [
        { label: 'ผูกเชือก', value: 'ผูกเชือก' },
        { label: 'สวม', value: 'สวม' },
        { label: 'รัดส้น', value: 'รัดส้น' },
      ],
      applicableSubCats: ['รองเท้า'],
    },
    {
      key: 'shoe_material',
      label: 'วัสดุรองเท้า',
      type: 'checkbox',
      options: [
        { label: 'หนัง', value: 'หนัง' },
        { label: 'ผ้าใบ', value: 'ผ้าใบ' },
        { label: 'ยาง', value: 'ยาง' },
      ],
      applicableSubCats: ['รองเท้า'],
    },
  ],
  'university-uniform-boy': [
    {
      key: 'collar',
      label: 'ประเภทคอ',
      type: 'checkbox',
      options: [
        { label: 'คอปก', value: 'คอปก' },
        { label: 'คอจีน', value: 'คอจีน' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'sleeve',
      label: 'แขน',
      type: 'checkbox',
      options: [
        { label: 'แขนสั้น', value: 'สั้น' },
        { label: 'แขนยาว', value: 'ยาว' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'fit',
      label: 'ทรง',
      type: 'checkbox',
      options: [
        { label: 'เข้ารูป', value: 'เข้ารูป' },
        { label: 'มาตรฐาน', value: 'มาตรฐาน' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'fabric',
      label: 'เนื้อผ้า',
      type: 'checkbox',
      options: [
        { label: 'คอตตอน', value: 'คอตตอน' },
        { label: 'โพลีเอสเตอร์', value: 'โพลีเอสเตอร์' },
        { label: 'ผ้าผสม', value: 'ผ้าผสม' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'shirt_size',
      label: 'ไซซ์',
      type: 'chip',
      options: [
        { label: 'XS', value: 'XS' },
        { label: 'S', value: 'S' },
        { label: 'M', value: 'M' },
        { label: 'L', value: 'L' },
        { label: 'XL', value: 'XL' },
      ],
      applicableSubCats: ['เสื้อ'],
    },
    {
      key: 'pant_fit',
      label: 'ทรงกางเกง',
      type: 'checkbox',
      options: [
        { label: 'กระบอก', value: 'กระบอก' },
        { label: 'กระบอกเล็ก', value: 'กระบอกเล็ก' },
        { label: 'ตรง', value: 'ตรง' },
        { label: 'เดฟ', value: 'เดฟ' },
        { label: 'ขาม้า', value: 'ขาม้า' },
        { label: 'ขากว้าง', value: 'ขากว้าง' },
      ],
      applicableSubCats: ['กางเกง'],
    },
    {
      key: 'waist',
      label: 'เอว',
      type: 'checkbox',
      options: [
        { label: 'เอวสูง', value: 'สูง' },
        { label: 'เอวกลาง', value: 'กลาง' },
        { label: 'เอวต่ำ', value: 'ต่ำ' },
      ],
      applicableSubCats: ['กางเกง'],
    },
    {
      key: 'inseam',
      label: 'ความยาวขา',
      type: 'checkbox',
      options: [
        { label: 'สั้น', value: 'สั้น' },
        { label: 'ปกติ', value: 'ปกติ' },
        { label: 'ยาว', value: 'ยาว' },
      ],
      applicableSubCats: ['กางเกง'],
    },
    {
      key: 'pants_size_num',
      label: 'ไซซ์',
      type: 'chip',
      options: [
        { label: '28', value: '28' },
        { label: '29', value: '29' },
        { label: '30', value: '30' },
        { label: '32', value: '32' },
        { label: '34', value: '34' },
        { label: '36', value: '36' },
        { label: '38', value: '38' },
        { label: '40', value: '40' },
      ],
      applicableSubCats: ['กางเกง'],
    },
    {
      key: 'shoe_size',
      label: 'ไซซ์รองเท้า',
      type: 'chip',
      options: Array.from({ length: 9 }, (_, i) => {
        const v = String(36 + i);
        return { label: v, value: v };
      }),
      applicableSubCats: ['รองเท้า'],
    },
    {
      key: 'shoe_type',
      label: 'ประเภทรองเท้า',
      type: 'checkbox',
      options: [
        { label: 'ผูกเชือก', value: 'ผูกเชือก' },
        { label: 'สวม', value: 'สวม' },
        { label: 'รัดส้น', value: 'รัดส้น' },
      ],
      applicableSubCats: ['รองเท้า'],
    },
    {
      key: 'shoe_material',
      label: 'วัสดุรองเท้า',
      type: 'checkbox',
      options: [
        { label: 'หนัง', value: 'หนัง' },
        { label: 'ผ้าใบ', value: 'ผ้าใบ' },
        { label: 'ยาง', value: 'ยาง' },
      ],
      applicableSubCats: ['รองเท้า'],
    },
  ],
  unisex: [
    {
      key: 'bag_type',
      label: 'ประเภทกระเป๋า',
      type: 'checkbox',
      options: [
        { label: 'เป้', value: 'เป้' },
        { label: 'สะพายข้าง', value: 'สะพายข้าง' },
        { label: 'ถือ', value: 'ถือ' },
      ],
      applicableSubCats: ['กระเป๋า'],
    },
    {
      key: 'bag_size',
      label: 'ขนาดกระเป๋า',
      type: 'checkbox',
      options: [
        { label: 'เล็ก', value: 'เล็ก' },
        { label: 'กลาง', value: 'กลาง' },
        { label: 'ใหญ่', value: 'ใหญ่' },
      ],
      applicableSubCats: ['กระเป๋า'],
    },
    {
      key: 'hat_type',
      label: 'ประเภทหมวก',
      type: 'checkbox',
      options: [
        { label: 'หมวกแก๊ป', value: 'แก๊ป' },
        { label: 'หมวกผ้า', value: 'ผ้า' },
        { label: 'หมวกทรงสี่เหลี่ยม', value: 'สี่เหลี่ยม' },
      ],
      applicableSubCats: ['หมวก'],
    },
  ],
  'graduation-formal': [
    {
      key: 'formal_type',
      label: 'ประเภท',
      type: 'checkbox',
      options: [
        { label: 'ชุดครุย', value: 'ชุดครุย' },
        { label: 'เสื้อเชิ้ต', value: 'เสื้อเชิ้ต' },
        { label: 'เนกไท', value: 'เนกไท' },
      ],
    },
  ],
};

/**
 * Get the full filter list for a category, optionally narrowed by sub-category.
 * Returns common filters + category-specific filters that apply to the sub-category.
 */
export function getFiltersForCategory(categorySlug: string, subCat?: string): FilterGroup[] {
  const specific = CATEGORY_FILTERS[categorySlug] || [];
  const applicableSpecific = subCat
    ? specific.filter((g) => !g.applicableSubCats || g.applicableSubCats.length === 0 || g.applicableSubCats.includes(subCat))
    : specific;
  return [...applicableSpecific, ...COMMON_FILTERS];
}
