import { z } from 'zod'

// User Types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof UserSchema>

// Product Types
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  imageUrl: z.string().url(),
  category: z.string(),
  inventory: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Product = z.infer<typeof ProductSchema>

// Cart Types
export const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
})

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  total: z.number(),
})

export type CartItem = z.infer<typeof CartItemSchema>
export type Cart = z.infer<typeof CartSchema>

// Order Types
export const OrderStatus = z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
export const PaymentMethod = z.enum(['paypal', 'stripe_card', 'apple_pay', 'google_pay'])

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  email: z.string().email(),
  items: z.array(CartItemSchema),
  subtotal: z.number().positive(),
  tax: z.number(),
  shipping: z.number(),
  total: z.number().positive(),
  status: OrderStatus,
  paymentMethod: PaymentMethod,
  paymentId: z.string(),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Order = z.infer<typeof OrderSchema>

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
})

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
} 