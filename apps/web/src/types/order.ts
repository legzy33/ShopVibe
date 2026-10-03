import { SupportedCurrency } from '@shopvibe/shared';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded';

export type PaymentMethod = 
  | 'stripe' 
  | 'paypal' 
  | 'apple_pay' 
  | 'google_pay';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface BillingAddress extends ShippingAddress {}

export interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  // Currency the order was priced and charged in; all amounts above are in it
  currency: SupportedCurrency;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface CheckoutFormData {
  email: string;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  sameAsShipping: boolean;
  paymentMethod: PaymentMethod;
  saveInfo: boolean;
} 