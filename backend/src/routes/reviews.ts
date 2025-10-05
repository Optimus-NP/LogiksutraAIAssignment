import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Review from '../models/Review';
import Book from '../models/Book';
import { protect, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
router.post(
  '/',
  protect,
  [
    body('bookId').isMongoId().withMessage('Valid book ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('reviewText').trim().isLength({ min: 1 }).withMessage('Review text is required'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const { bookId, rating, reviewText } = req.body;

      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }

      // Check if user already reviewed this book
      const existingReview = await Review.findOne({
        bookId,
        userId: req.user?._id,
      });

      if (existingReview) {
        res.status(400).json({ message: 'You have already reviewed this book' });
        return;
      }

      const review = new Review({
        bookId,
        userId: req.user?._id,
        rating,
        reviewText,
      });

      const createdReview = await review.save();
      const populatedReview = await Review.findById(createdReview._id)
        .populate('userId', 'name')
        .populate('bookId', 'title');

      res.status(201).json(populatedReview);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Owner only)
router.put(
  '/:id',
  protect,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('reviewText').optional().trim().isLength({ min: 1 }).withMessage('Review text cannot be empty'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const review = await Review.findById(req.params.id);

      if (!review) {
        res.status(404).json({ message: 'Review not found' });
        return;
      }

      // Check if user is owner
      if (review.userId.toString() !== req.user?._id.toString()) {
        res.status(403).json({ message: 'Not authorized to update this review' });
        return;
      }

      const updatedReview = await Review.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('userId', 'name')
        .populate('bookId', 'title');

      res.json(updatedReview);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner only)
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Check if user is owner
    if (review.userId.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: 'Not authorized to delete this review' });
      return;
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get reviews for a book
// @route   GET /api/reviews/book/:bookId
// @access  Public
router.get('/book/:bookId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ bookId: req.params.bookId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
