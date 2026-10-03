'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Review, ReviewSummary, ReviewFormData, ReviewFilters } from '../types/review';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface ReviewContextType {
  reviews: Review[];
  reviewSummaries: { [productId: string]: ReviewSummary };
  isSubmittingReview: boolean;
  reviewError: string | null;
  // Review functions
  getProductReviews: (productId: string, filters?: ReviewFilters) => Promise<Review[]>;
  getProductReviewSummary: (productId: string) => Promise<ReviewSummary | undefined>;
  submitReview: (productId: string, reviewData: ReviewFormData) => Promise<Review>;
  markReviewHelpful: (reviewId: string, helpful: boolean) => void;
  // Filtering and sorting
  filterReviews: (reviews: Review[], filters: ReviewFilters) => Review[];
  sortReviews: (reviews: Review[], sortBy: ReviewFilters['sortBy']) => Review[];
  // Utility functions
  clearReviewError: () => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};

interface ReviewProviderProps {
  children: ReactNode;
}

export const ReviewProvider: React.FC<ReviewProviderProps> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<{ [productId: string]: ReviewSummary }>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const getProductReviews = async (productId: string, filters?: ReviewFilters): Promise<Review[]> => {
    try {
      const sortBy = (filters?.sortBy === 'helpful' ? 'newest' : filters?.sortBy) || 'newest';
      const response = await apiService.getProductReviews(productId, { sortBy });
      
      // Transform API response to Review type
      const transformedReviews: Review[] = response.data.map(review => ({
        id: review.id,
        productId: review.productId,
        userName: review.user.name,
        userAvatar: review.user.avatar,
        userLocation: '', // Not provided by API
        rating: review.rating,
        title: '', // Not provided by API
        content: review.comment || '',
        images: [], // Not provided by API
        verified: review.verified,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.updatedAt),
        pros: [],
        cons: [],
        recommendedUse: []
      }));

      // Apply local filters if provided
      let filtered = transformedReviews;
      if (filters) {
        filtered = filterReviews(filtered, filters);
      }

      setReviews(filtered);
      return filtered;
    } catch (error) {
      console.error('Failed to fetch product reviews:', error);
      setReviewError('Failed to load reviews');
      return [];
    }
  };

  const getProductReviewSummary = async (productId: string): Promise<ReviewSummary | undefined> => {
    try {
      const response = await apiService.getProductReviews(productId);
      
      const summary: ReviewSummary = {
        averageRating: response.statistics.averageRating,
        totalReviews: response.statistics.totalReviews,
        ratingDistribution: response.statistics.ratingDistribution,
        recommendationPercentage: Math.round((response.statistics.ratingDistribution[4] + response.statistics.ratingDistribution[5]) / response.statistics.totalReviews * 100) || 0,
        verifiedPurchases: response.statistics.verifiedPurchases
      };

      setReviewSummaries(prev => ({
        ...prev,
        [productId]: summary
      }));

      return summary;
    } catch (error) {
      console.error('Failed to fetch review summary:', error);
      return undefined;
    }
  };

  const submitReview = async (productId: string, reviewData: ReviewFormData): Promise<Review> => {
    if (!isAuthenticated) {
      throw new Error('Please login to submit a review');
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const response = await apiService.submitReview(
        productId,
        reviewData.rating,
        reviewData.content  // This gets passed as 'comment' parameter to the API
      );

      // Transform API response to Review type
      const newReview: Review = {
        id: response.review.id,
        productId: response.review.productId,
        userName: response.review.user.name,
        userLocation: reviewData.userLocation || '',
        rating: response.review.rating,
        title: reviewData.title || '',
        content: response.review.comment || '',
        images: [],
        verified: response.review.verified,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date(response.review.createdAt),
        updatedAt: new Date(response.review.updatedAt),
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        recommendedUse: reviewData.recommendedUse || []
      };

      setReviews(prev => [newReview, ...prev]);
      return newReview;
    } catch (error) {
      console.error('ReviewContext submitReview error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      setReviewError(errorMessage);
      throw new Error(errorMessage); // Re-throw with proper error message
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const markReviewHelpful = (reviewId: string, helpful: boolean): void => {
    // This is a local-only operation for now
    // In a real app, this would call an API endpoint
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          helpful: helpful ? review.helpful + 1 : review.helpful,
          notHelpful: !helpful ? review.notHelpful + 1 : review.notHelpful,
          updatedAt: new Date()
        };
      }
      return review;
    }));
  };

  const filterReviews = (reviewsToFilter: Review[], filters: ReviewFilters): Review[] => {
    let filtered = [...reviewsToFilter];

    if (filters.rating) {
      filtered = filtered.filter(review => review.rating === filters.rating);
    }

    if (filters.verified !== undefined) {
      filtered = filtered.filter(review => review.verified === filters.verified);
    }

    if (filters.withImages) {
      filtered = filtered.filter(review => review.images && review.images.length > 0);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        review.title.toLowerCase().includes(searchLower) ||
        review.content.toLowerCase().includes(searchLower) ||
        review.pros?.some(pro => pro.toLowerCase().includes(searchLower)) ||
        review.cons?.some(con => con.toLowerCase().includes(searchLower))
      );
    }

    return sortReviews(filtered, filters.sortBy);
  };

  const sortReviews = (reviewsToSort: Review[], sortBy: ReviewFilters['sortBy']): Review[] => {
    const sorted = [...reviewsToSort];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'helpful':
        return sorted.sort((a, b) => b.helpful - a.helpful);
      default:
        return sorted;
    }
  };

  const clearReviewError = (): void => {
    setReviewError(null);
  };

  const value: ReviewContextType = {
    reviews,
    reviewSummaries,
    isSubmittingReview,
    reviewError,
    getProductReviews,
    getProductReviewSummary,
    submitReview,
    markReviewHelpful,
    filterReviews,
    sortReviews,
    clearReviewError
  };

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
};