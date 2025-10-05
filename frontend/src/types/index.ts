export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  publishedYear: number;
  addedBy: {
    _id: string;
    name: string;
    email: string;
  };
  imageUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface BookFormData {
  title: string;
  author: string;
  description: string;
  genre: string;
  publishedYear: number;
  imageUrl?: string;
}

export interface Review {
  _id: string;
  bookId: string;
  userId: {
    _id: string;
    name: string;
  };
  rating: number;
  reviewText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFormData {
  bookId: string;
  rating: number;
  reviewText: string;
}

export interface BooksResponse {
  books: Book[];
  currentPage: number;
  totalPages: number;
  totalBooks: number;
}

export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
