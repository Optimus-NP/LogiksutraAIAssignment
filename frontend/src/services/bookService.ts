import axios from 'axios';
import { Book, BookFormData, BooksResponse, Review, ReviewFormData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookService = {
  getBooks: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    genre?: string;
  }): Promise<BooksResponse> => {
    const response = await api.get<BooksResponse>('/books', { params });
    return response.data;
  },

  getBook: async (id: string): Promise<Book> => {
    const response = await api.get<Book>(`/books/${id}`);
    return response.data;
  },

  createBook: async (bookData: BookFormData): Promise<Book> => {
    const response = await api.post<Book>('/books', bookData);
    return response.data;
  },

  updateBook: async (id: string, bookData: Partial<BookFormData>): Promise<Book> => {
    const response = await api.put<Book>(`/books/${id}`, bookData);
    return response.data;
  },

  deleteBook: async (id: string): Promise<void> => {
    await api.delete(`/books/${id}`);
  },
};

export const reviewService = {
  createReview: async (reviewData: ReviewFormData): Promise<Review> => {
    const response = await api.post<Review>('/reviews', reviewData);
    return response.data;
  },

  updateReview: async (id: string, reviewData: Partial<ReviewFormData>): Promise<Review> => {
    const response = await api.put<Review>(`/reviews/${id}`, reviewData);
    return response.data;
  },

  deleteReview: async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },

  getBookReviews: async (bookId: string): Promise<Review[]> => {
    const response = await api.get<Review[]>(`/reviews/book/${bookId}`);
    return response.data;
  },
};
