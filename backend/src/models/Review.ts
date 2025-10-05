import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  bookId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      maxlength: [500, 'Review text cannot be more than 500 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per book
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

export default model<IReview>('Review', reviewSchema);
