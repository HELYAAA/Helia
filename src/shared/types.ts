// Shared types used by both shop and admin apps
export interface Game {
  id: string;
  name: string;
  image: string;
  discount?: number;
  products: Product[];
  category?: string;
  serverLabel?: string;
  note?: string;
  disclaimer?: string;
  gridSpan?: 'normal' | 'wide';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  bonus?: string;
  image?: string;
  special?: boolean;
  subscription?: boolean;
  doubleReward?: boolean;
  note?: string;
  battlePass?: boolean;
  pass?: boolean;
  welkinMoon?: boolean;
  genesis?: boolean;
  chronal?: boolean;
}

export interface Payment {
  id: string;
  name: string;
  logo?: string;
  qrCode?: string;
  accountName?: string;
  accountNumber?: string;
  type?: string;
}

export interface OrderData {
  game: Game | null;
  playerId: string;
  server: string;
  ign?: string;
  product: Product | null;
  quantity: number;
  payment: Payment | null;
  receiptFile: File | null;
}

export interface CartItem {
  id: string;
  game: Game;
  playerId: string;
  server: string;
  ign?: string;
  product: Product;
  quantity: number;
}

export interface SiteSettings {
  orderMethod: 'messenger' | 'place_order';
  banners: string[];
}
