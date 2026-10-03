import { Product } from './product';

export interface ProductVariant {
  size?: string;
  color?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  addedAt: Date;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  updatedAt: Date;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  variant?: ProductVariant;
}

export interface UpdateCartItemPayload {
  itemId: string;
  quantity: number;
} 