import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../services/bookService';
import { BookFormData, Book } from '../types';

const EditBookPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    description: '',
    genre: '',
    publishedYear: new Date().getFullYear(),
    imageUrl: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business'
  ];

  useEffect(() => {
    if (id) {
      fetchBook();
    }
  }, [id]);

  const fetchBook = async () => {
    if (!id) return;
    
    try {
      const bookData = await bookService.getBook(id);
      setBook(bookData);
      
      // Check if user can edit this book
      if (state.user && bookData.addedBy._id !== state.user._id) {
        setError('You are not authorized to edit this book');
        return;
      }
      
      // Populate form with existing data
      setFormData({
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        genre: bookData.genre,
        publishedYear: bookData.publishedYear,
        imageUrl: bookData.imageUrl || ''
      });
    } catch (err) {
      setError('Failed to load book details');
      console.error('Error fetching book:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'publishedYear' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !book) return;
    
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.author.trim()) {
      setError('Author is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.genre) {
      setError('Please select a genre');
      return;
    }
    if (formData.publishedYear < 1000 || formData.publishedYear > new Date().getFullYear()) {
      setError('Please enter a valid publication year');
      return;
    }

    setIsLoading(true);

    try {
      await bookService.updateBook(id, formData);
      navigate(`/books/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Loading book details...</p>
      </div>
    );
  }

  if (error && !book) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/books" className="btn-primary">
          Back to Books
        </Link>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Book not found</p>
        <Link to="/books" className="btn-primary">
          Back to Books
        </Link>
      </div>
    );
  }

  // Check authorization
  if (state.user && book.addedBy._id !== state.user._id) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">You are not authorized to edit this book</p>
        <Link to={`/books/${id}`} className="btn-primary">
          Back to Book Details
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to={`/books/${id}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Book Details
        </Link>
        <h1 className="text-3xl font-bold">Edit Book</h1>
        <p className="text-gray-600 mt-2">Update the details for "{book.title}"</p>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder="Enter book title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="input"
                placeholder="Enter author name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre *
                </label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Select a genre</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Published Year *
                </label>
                <input
                  type="number"
                  name="publishedYear"
                  value={formData.publishedYear}
                  onChange={handleChange}
                  className="input"
                  min="1000"
                  max={new Date().getFullYear()}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="input"
                placeholder="Enter book description..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Provide a detailed description of the book's content, themes, and what readers can expect.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book Cover Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="input"
                placeholder="https://example.com/book-cover.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Enter a URL for the book cover image. This will be displayed on the book list and details pages.
              </p>
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Book cover preview"
                    className="w-24 h-32 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? 'Updating Book...' : 'Update Book'}
              </button>
              <Link to={`/books/${id}`} className="btn-outline flex-1 text-center">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> All fields marked with * are required. Changes will be saved immediately when you click "Update Book".</p>
      </div>
    </div>
  );
};

export default EditBookPage;
