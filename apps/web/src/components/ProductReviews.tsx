'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReview } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import { ReviewFilters, ReviewFormData, Review, ReviewSummary } from '../types/review';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { 
    getProductReviews, 
    getProductReviewSummary, 
    submitReview, 
    markReviewHelpful,
    isSubmittingReview 
  } = useReview();
  const { isAuthenticated, user } = useAuth();
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filters, setFilters] = useState<ReviewFilters>({
    sortBy: 'newest'
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Check if component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch reviews and summary when component mounts or filters change
  useEffect(() => {
    const fetchReviewData = async () => {
      setIsLoading(true);
      try {
        const [fetchedReviews, fetchedSummary] = await Promise.all([
          getProductReviews(productId, filters),
          getProductReviewSummary(productId)
        ]);
        setReviews(fetchedReviews);
        setSummary(fetchedSummary);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, filters]);

  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    content: '',
    pros: [],
    cons: [],
    recommendedUse: [],
    images: [],
    recommend: true,
    userName: '',
    userLocation: ''
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmitReview called!');
    console.log('Product ID:', productId);
    console.log('Review Form Data:', reviewForm);
    
    // Validate required fields
    if (!reviewForm.content.trim()) {
      alert('Please enter a review comment');
      return;
    }
    
    // userName is not required - it comes from authenticated user
    
    try {
      console.log('Calling submitReview...');
      await submitReview(productId, reviewForm);
      console.log('Review submitted successfully!');
      
      setShowReviewForm(false);
      setReviewForm({
        rating: 5,
        title: '',
        content: '',
        pros: [],
        cons: [],
        recommendedUse: [],
        images: [],
        recommend: true,
        userName: '',
        userLocation: ''
      });
      
      // Refresh reviews and summary after submission
      const [fetchedReviews, fetchedSummary] = await Promise.all([
        getProductReviews(productId, filters),
        getProductReviewSummary(productId)
      ]);
      setReviews(fetchedReviews);
      setSummary(fetchedSummary);
    } catch (error) {
      console.error('Failed to submit review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to submit review: ' + errorMessage);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <svg
              className={`w-5 h-5 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading reviews...</span>
        </div>
      </div>
    );
  }

  // Check if current user has already reviewed this product
  const hasUserReviewed = reviews.some(review => review.userName === user?.name);

  const handleWriteReviewClick = () => {
    if (hasUserReviewed) {
      alert("You've already reviewed this product. Each user can only submit one review per product.");
      return;
    }
    setShowReviewForm(true);
  };

  if (!summary) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        {isAuthenticated ? (
          <button
            onClick={handleWriteReviewClick}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            Write a Review
          </button>
        ) : (
          <p className="mt-4 text-sm text-gray-600">Please sign in to write a review</p>
        )}

        {/* Ensure the modal can open even when summary is not yet available */}
        {showReviewForm && isMounted && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowReviewForm(false)} />
              <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold">Write a Review</h3>
                  <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Minimal form shell to allow user to proceed even if summary hasn't loaded */}
                <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                    {renderStars(reviewForm.rating, true, (rating) => setReviewForm(prev => ({ ...prev, rating })))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Summarize your experience"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                    <textarea
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Share details of your experience"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isSubmittingReview} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  console.log('ProductReviews render - showReviewForm:', showReviewForm, 'isAuthenticated:', isAuthenticated);

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
        
        {/* Review Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-4xl font-bold">{summary.averageRating}</div>
              <div>
                {renderStars(summary.averageRating)}
                <p className="text-sm text-gray-600">{summary.totalReviews} reviews</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm w-8">{rating} ★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${(summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution] / summary.totalReviews) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm w-8 text-gray-600">
                    {summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Would recommend</span>
                <span className="text-sm font-medium">{summary.recommendationPercentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Verified purchases</span>
                <span className="text-sm font-medium">{summary.verifiedPurchases}</span>
              </div>
            </div>
            
            {isAuthenticated ? (
              <button
                onClick={handleWriteReviewClick}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                type="button"
              >
                Write a Review
              </button>
            ) : (
              <p className="mt-4 text-sm text-gray-600 text-center">Please sign in to write a review</p>
            )}
          </div>
        </div>

        {/* Review Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <label htmlFor="sortBy" className="text-sm font-medium">Sort by:</label>
            <select
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as ReviewFilters['sortBy'] }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="rating" className="text-sm font-medium">Rating:</label>
            <select
              id="rating"
              value={filters.rating || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value ? Number(e.target.value) : undefined }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={filters.verified || false}
              onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
              className="w-4 h-4 text-blue-600"
            />
            <span>Verified purchases only</span>
          </label>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  {renderStars(review.rating)}
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified Purchase</span>
                  )}
                </div>
                <h4 className="font-semibold">{review.title}</h4>
                <p className="text-sm text-gray-600">
                  by {review.userName} {review.userLocation && `from ${review.userLocation}`} • {review.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.content}</p>

            {(review.pros && review.pros.length > 0) && (
              <div className="mb-3">
                <h5 className="font-medium text-green-700 mb-1">Pros:</h5>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {review.pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
            )}

            {(review.cons && review.cons.length > 0) && (
              <div className="mb-3">
                <h5 className="font-medium text-red-700 mb-1">Cons:</h5>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {review.cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </div>
            )}

            {review.images && review.images.length > 0 && (
              <div className="mb-4">
                <div className="flex space-x-2">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4 text-sm">
              <button
                onClick={() => markReviewHelpful(review.id, true)}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>Helpful ({review.helpful})</span>
              </button>
              
              <button
                onClick={() => markReviewHelpful(review.id, false)}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
                <span>Not helpful ({review.notHelpful})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 5 && (
        <div className="text-center mt-6">
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View all {reviews.length} reviews
          </button>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && isMounted && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowReviewForm(false)} />
            
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold">Write a Review</h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                  {renderStars(reviewForm.rating, true, (rating) => setReviewForm(prev => ({ ...prev, rating })))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Summarize your experience"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                  <textarea
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your thoughts about this product..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={reviewForm.userName}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, userName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
                    <input
                      type="text"
                      value={reviewForm.userLocation}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, userLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, State"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductReviews; 