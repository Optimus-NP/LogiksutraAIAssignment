import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { BookFormData } from '../types';

const AddBookPage: React.FC = () => {
  const navigate = useNavigate();
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

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'publishedYear' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const newBook = await bookService.createBook(formData);
      navigate(`/books/${newBook._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/books" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Books
        </Link>
        <h1 className="text-3xl font-bold">Add New Book</h1>
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
                {isLoading ? 'Adding Book...' : 'Add Book'}
              </button>
              <Link to="/books" className="btn-outline flex-1 text-center">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> All fields marked with * are required. Once you add a book, you can edit or delete it later from the book details page.</p>
      </div>
    </div>
  );
};

export default AddBookPage;
