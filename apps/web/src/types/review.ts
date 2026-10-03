export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userLocation?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  videos?: string[];
  verified: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
  pros?: string[];
  cons?: string[];
  recommendedUse?: string[];
  productVariant?: {
    size?: string;
    color?: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recommendationPercentage: number;
  verifiedPurchases: number;
}

export interface ReviewFormData {
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  recommendedUse: string[];
  images: File[];
  recommend: boolean;
  userName: string;
  userLocation: string;
}

export interface ReviewFilters {
  rating?: number;
  verified?: boolean;
  withImages?: boolean;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
  searchTerm?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

export interface ReviewMetrics {
  conversionLift: number;
  engagementRate: number;
  helpfulnessScore: number;
} 