export interface Product {
  id: string; // Changed from number to string to match backend
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating: number;
  reviewCount: number; // Renamed from reviews to match backend
  createdAt: string;
  updatedAt: string;
  _count?: { reviews: number };
}

export type ProductCategory = 'electronics' | 'clothing' | 'home' | 'beauty' | 'sports'; 