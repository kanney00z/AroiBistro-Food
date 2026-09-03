export type OrderType = 'dine_in' | 'pickup' | 'delivery';

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'delivering' | 'completed' | 'cancelled';

export type PaymentMethod = 'promptpay' | 'credit_card' | 'cash';
export type PaymentStatus = 'paid' | 'pending';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing';

export interface OptionChoice {
  id: string;
  name: string;
  nameEn?: string;
  priceDelta: number; // e.g. +20 THB
}

export interface OptionGroup {
  id: string;
  name: string;
  nameEn?: string;
  required: boolean;
  maxSelect?: number;
  choices: OptionChoice[];
}

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviewsCount: number;
  prepTimeMinutes: number;
  isPopular?: boolean;
  isSpicy?: number; // 0, 1, 2, 3
  isVegetarian?: boolean;
  isChefSpecial?: boolean;
  calories?: number;
  available: boolean;
  optionGroups?: OptionGroup[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  priceDelta: number;
}

export interface CartItem {
  id: string; // unique cart item id
  menuItem: MenuItem;
  selectedOptions: SelectedOption[];
  quantity: number;
  packagingType?: 'dine_in' | 'takeaway'; // ทานที่ร้าน vs สั่งกลับบ้าน
  round?: number; // รอบการสั่ง (e.g. รอบที่ 1, รอบที่ 2 สั่งเพิ่ม)
  addedAt?: string;
  specialInstructions?: string;
  excludedIngredients?: string[]; // สิ่งที่ไม่อยากกิน / ไม่อยากใส่ / แพ้ เช่น ['ผักชี', 'พริก', 'ผงชูรส']
  customDishDetails?: {
    isCustomDish: boolean;
    customName: string;
    description?: string;
    preferences?: string;
    isPricePending?: boolean; // true = รอทางร้านใส่ราคาหลังบ้าน
  };
  itemTotal: number;
}

export interface DeliveryLocation {
  lat: number;
  lng: number;
  address: string;
  buildingDetails?: string; // e.g. "อาคาร B ชั้น 5 ห้อง 502"
  driverNote?: string; // e.g. "ฝากไว้ที่ล็อบบี้ / โทรเมื่อถึง"
  distanceKm?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  deliveryAddress?: string;
  deliveryLocation?: DeliveryLocation;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoCodeApplied?: string;
  serviceCharge: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  slipImage?: string; // Real uploaded transfer slip image (base64 data URL)
  createdAt: string;
  updatedAt?: string;
  roundsCount?: number; // จำนวนรอบที่สั่ง (1 = สั่งรอบแรก, 2+ = สั่งเพิ่มเข้าบิลเดิม)
  hasNewItems?: boolean;
  estimatedMinutes?: number;
  notes?: string;
}

export interface Table {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  zone: string;
  status: TableStatus;
  currentOrderId?: string;
  guestCount?: number;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  iconName: string;
  description: string;
}

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number; // e.g. 15 (%) or 50 (THB)
  minOrder: number;
  maxDiscount?: number;
  active: boolean;
  description: string;
}

export interface SpecialHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  note?: string;
}

export interface StoreStatusInfo {
  isOpen: boolean;
  status: 'open' | 'closed_hours' | 'closed_weekly_holiday' | 'closed_special_holiday' | 'closed_manual';
  statusText: string;
  statusDetail: string;
  nextOpenText: string;
  todayDayName: string;
  currentTimeStr: string;
}

export interface HeroBannerSettings {
  badgeText: string; // e.g. "CULINARY EXCELLENCE 2026"
  titleLine1: string; // e.g. "CRAFTED FLAVORS."
  titleLine2: string; // e.g. "UNCOMPROMISED TASTE."
  subtitle: string; // e.g. "คัดสรรเนื้อวากิวออสเตรเลีย พาสต้าทรัฟเฟิลเส้นสด..."
  cardBadge: string; // e.g. "CHEF'S SIGNATURE"
  cardTitle: string; // e.g. "เนื้อวากิวออสเตรเลีย & ทรัฟเฟิลสด"
  cardSubtitle: string; // e.g. "เริ่มต้นเพียง ฿340"
  cardRating: string; // e.g. "4.9"
  cardImageUrl: string; // Image URL
  feature1Text: string; // e.g. "วัตถุดิบนำเข้าเกรด A+"
  feature2Text: string; // e.g. "เสิร์ฟด่วน 15-20 นาที"
  showCustomDishButton: boolean;
  customDishButtonText: string; // e.g. "✨ สั่งทำเมนูพิเศษตามใจคุณ"
  showPromoCodes: boolean;
  promoCode1: string;
  promoLabel1: string;
  promoCode2: string;
  promoLabel2: string;
}

export interface RestaurantSettings {
  name: string;
  nameEn: string;
  tagline: string;
  address: string;
  phone: string;
  openTime: string; // e.g. "10:30"
  closeTime: string; // e.g. "22:00"
  isOpen: boolean; // Master manual toggle
  autoScheduleEnabled: boolean; // Auto-detect by open/close hours and holidays
  weeklyClosedDays: number[]; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  specialHolidays: SpecialHoliday[]; // Specific holiday dates
  closedMessage?: string; // Custom alert message when store is closed
  promptPayId: string;
  serviceChargeRate: number; // e.g. 0.10 for 10%
  vatRate: number; // e.g. 0.07 for 7%
  enableServiceCharge: boolean;
  
  // Delivery Settings & Radius Configuration
  restaurantLat?: number; // Store GPS Latitude (e.g. 13.7367)
  restaurantLng?: number; // Store GPS Longitude (e.g. 100.5831)
  deliveryBaseFee: number; // Base delivery fee (THB) e.g. 40
  deliveryMaxDistanceKm?: number; // Max delivery radius in km (e.g. 10, 15, or 0 = unlimited)
  deliveryPerKmFee?: number; // Fee per km beyond free km (e.g. 10 THB/km)
  deliveryFreeKm?: number; // Initial distance included in base fee (e.g. 2 km)
  deliveryFreeMinOrder?: number; // Free delivery threshold (e.g. 600 THB)
  deliveryMinOrderAmount?: number; // Minimum food order to allow delivery (e.g. 150 THB)
  allowOutOfRadiusOrder?: boolean; // If true, allows delivery beyond max radius with warning; if false, blocks order
  outOfRadiusMessage?: string; // Custom warning message for out of range addresses

  adminPin?: string; // PIN code to access Admin Backoffice (default "1234")
  heroBanner?: HeroBannerSettings;
  lineNotifyEnabled?: boolean; // Enable/disable LINE notifications
  lineChannelAccessToken?: string; // LINE Messaging API Channel Access Token
  lineTargetId?: string; // Target User ID or Group ID (leave empty for Broadcast)
}
