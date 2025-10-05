import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookService, reviewService } from '../services/bookService';
import { Book, Review, ReviewFormData } from '../types';

const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewText: ''
  });

  useEffect(() => {
    if (id) {
      fetchBookAndReviews();
    }
  }, [id]);

  const fetchBookAndReviews = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [bookData, reviewsData] = await Promise.all([
        bookService.getBook(id),
        reviewService.getBookReviews(id)
      ]);
      
      setBook(bookData);
      setReviews(reviewsData);
      setError('');
    } catch (err) {
      setError('Failed to load book details');
      console.error('Error fetching book details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !state.user) return;

    setReviewError('');
    setIsSubmittingReview(true);

    try {
      const reviewData: ReviewFormData = {
        bookId: book._id,
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText
      };

      if (editingReview) {
        await reviewService.updateReview(editingReview._id, reviewData);
      } else {
        await reviewService.createReview(reviewData);
      }

      setReviewForm({ rating: 5, reviewText: '' });
      setShowReviewForm(false);
      setEditingReview(null);
      await fetchBookAndReviews(); // Refresh data
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setReviewForm({
      rating: review.rating,
      reviewText: review.reviewText
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewService.deleteReview(reviewId);
      await fetchBookAndReviews();
    } catch (err) {
      setReviewError('Failed to delete review');
    }
  };

  const handleDeleteBook = async () => {
    if (!book || !confirm('Are you sure you want to delete this book?')) return;

    try {
      await bookService.deleteBook(book._id);
      navigate('/books');
    } catch (err) {
      setError('Failed to delete book');
    }
  };

  const cancelReviewForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    setReviewForm({ rating: 5, reviewText: '' });
    setReviewError('');
  };

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Book not found'}</p>
        <Link to="/books" className="btn-primary">
          Back to Books
        </Link>
      </div>
    );
  }

  const userReview = reviews.find(r => r.userId._id === state.user?._id);
  const canEditBook = state.user && book.addedBy._id === state.user._id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Book Header */}
      <div className="mb-6">
        <Link to="/books" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Books
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Book Cover */}
          {book.imageUrl && (
            <div className="md:col-span-1">
              <img
                src={book.imageUrl}
                alt={`${book.title} cover`}
                className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Book Info */}
          <div className={book.imageUrl ? "md:col-span-3" : "md:col-span-4"}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600 mb-2">by {book.author}</p>
                <p className="text-gray-500 mb-4">{book.genre} • {book.publishedYear}</p>
                
                {/* Average Rating */}
                {book.averageRating !== undefined && (
                  <div className="flex items-center gap-4 mb-4">
                    {renderStars(Math.round(book.averageRating))}
                    <span className="text-lg font-medium">
                      {book.averageRating.toFixed(1)} ({book.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>
              
              {canEditBook && (
                <div className="flex gap-2">
                  <Link to={`/edit-book/${book._id}`} className="btn-secondary">
                    Edit Book
                  </Link>
                  <button onClick={handleDeleteBook} className="btn-danger">
                    Delete Book
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{book.description}</p>
            <div className="mt-4 text-sm text-gray-500">
              Added by {book.addedBy.name} on {new Date(book.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reviews</h2>
          {state.isAuthenticated && !userReview && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn-primary"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold">
                {editingReview ? 'Edit Review' : 'Write a Review'}
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {reviewError}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  {renderStars(reviewForm.rating, true, (rating) => 
                    setReviewForm({ ...reviewForm, rating })
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review
                  </label>
                  <textarea
                    value={reviewForm.reviewText}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                    rows={4}
                    className="input"
                    placeholder="Share your thoughts about this book..."
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="btn-primary"
                  >
                    {isSubmittingReview ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
                  </button>
                  <button
                    type="button"
                    onClick={cancelReviewForm}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No reviews yet. Be the first to review this book!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{review.userId.name}</span>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {state.user && review.userId._id === state.user._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{review.reviewText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailsPage;
