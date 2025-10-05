import { Schema, model, Document, Types } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  genre: string;
  publishedYear: number;
  addedBy: Types.ObjectId;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [100, 'Author name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
      maxlength: [50, 'Genre cannot be more than 50 characters'],
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required'],
      min: [1000, 'Published year must be after 1000'],
      max: [new Date().getFullYear(), 'Published year cannot be in the future'],
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ title: 'text', author: 'text', description: 'text' });

export default model<IBook>('Book', bookSchema);
