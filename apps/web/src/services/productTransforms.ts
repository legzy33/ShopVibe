import { Product } from '../types/product';

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { reviews: number };
}

export interface ApiProductListResponse {
  success: boolean;
  data: ApiProduct[];
}

export const mapApiProduct = (product: ApiProduct): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  imageUrl: product.imageUrl,
  category: product.category,
  inStock: product.inStock,
  rating: product.rating ?? 0,
  reviewCount: product.reviewCount,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  _count: product._count,
});
