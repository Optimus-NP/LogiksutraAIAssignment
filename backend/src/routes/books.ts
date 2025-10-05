import express, { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import Book from '../models/Book';
import Review from '../models/Review';
import { protect, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// @desc    Get all books with pagination
// @route   GET /api/books
// @access  Public
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('search').optional().isString().trim(),
    query('genre').optional().isString().trim(),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const search = req.query.search as string;
      const genre = req.query.genre as string;

      const skip = (page - 1) * limit;

      let query: Record<string, unknown> = {};

      if (search) {
        query.$text = { $search: search };
      }

      if (genre) {
        query.genre = new RegExp(genre, 'i');
      }

      const books = await Book.find(query)
        .populate('addedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Book.countDocuments(query);

      // Calculate average ratings for each book
      const booksWithRatings = await Promise.all(
        books.map(async (book) => {
          const reviews = await Review.find({ bookId: book._id });
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0;
          
          return {
            ...book.toObject(),
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length,
          };
        })
      );

      res.json({
        books: booksWithRatings,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBooks: total,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id).populate('addedBy', 'name email');

    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    const reviews = await Review.find({ bookId: book._id }).populate('userId', 'name');
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    res.json({
      ...book.toObject(),
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new book
// @route   POST /api/books
// @access  Private
router.post(
  '/',
  protect,
  [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('author').trim().isLength({ min: 1 }).withMessage('Author is required'),
    body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    body('genre').trim().isLength({ min: 1 }).withMessage('Genre is required'),
    body('publishedYear').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Invalid published year'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const { title, author, description, genre, publishedYear } = req.body;

      const book = new Book({
        title,
        author,
        description,
        genre,
        publishedYear,
        addedBy: req.user?._id,
      });

      const createdBook = await book.save();
      const populatedBook = await Book.findById(createdBook._id).populate('addedBy', 'name email');

      res.status(201).json(populatedBook);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Owner only)
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
    body('author').optional().trim().isLength({ min: 1 }).withMessage('Author cannot be empty'),
    body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
    body('genre').optional().trim().isLength({ min: 1 }).withMessage('Genre cannot be empty'),
    body('publishedYear').optional().isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Invalid published year'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const book = await Book.findById(req.params.id);

      if (!book) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }

      // Check if user is owner
      if (book.addedBy.toString() !== req.user?._id.toString()) {
        res.status(403).json({ message: 'Not authorized to update this book' });
        return;
      }

      const updatedBook = await Book.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('addedBy', 'name email');

      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Owner only)
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    // Check if user is owner
    if (book.addedBy.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: 'Not authorized to delete this book' });
      return;
    }

    await Book.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ bookId: req.params.id });

    res.json({ message: 'Book and associated reviews deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
