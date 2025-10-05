import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../services/bookService';
import { Book, BooksResponse } from '../types';

const BookListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  
  const { state } = useAuth();
  const limit = 12; // Load more books per page for infinite scroll

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business'
  ];

  useEffect(() => {
    const searchTerm = searchParams.get('search') || '';
    const genreFilter = searchParams.get('genre') || '';
    
    setSearch(searchTerm);
    setGenre(genreFilter);
    
    // Reset state when filters change
    setBooks([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchBooks(1, searchTerm, genreFilter, true);
  }, [searchParams]);

  const fetchBooks = async (page: number = 1, searchTerm: string = '', genreFilter: string = '', isNewSearch: boolean = false) => {
    try {
      if (isNewSearch) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params: any = { page, limit };
      if (searchTerm) params.search = searchTerm;
      if (genreFilter) params.genre = genreFilter;
      
      const response: BooksResponse = await bookService.getBooks(params);
      
      if (isNewSearch) {
        setBooks(response.books);
      } else {
        // Filter out any duplicate books to prevent key conflicts
        setBooks(prevBooks => {
          const existingIds = new Set(prevBooks.map(book => book._id));
          const newBooks = response.books.filter(book => !existingIds.has(book._id));
          return [...prevBooks, ...newBooks];
        });
      }
      
      setCurrentPage(response.currentPage);
      setTotalBooks(response.totalBooks);
      setHasMore(response.currentPage < response.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to fetch books');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreBooks = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchBooks(currentPage + 1, search, genre, false);
    }
  }, [currentPage, search, genre, loadingMore, hasMore]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore) {
        return;
      }
      loadMoreBooks();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(search, genre);
  };

  const handleGenreChange = (selectedGenre: string) => {
    setGenre(selectedGenre);
    updateFilters(search, selectedGenre);
  };

  const updateFilters = (searchTerm: string, genreFilter: string) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (genreFilter) params.set('genre', genreFilter);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setGenre('');
    setSearchParams({});
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Loading books...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Books</h1>
        {state.isAuthenticated && (
          <Link to="/add-book" className="btn-primary">
            Add New Book
          </Link>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="card mb-6">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Books
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or author..."
                className="input"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => handleGenreChange(e.target.value)}
                className="input"
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              Search
            </button>
            <button type="button" onClick={clearFilters} className="btn-outline">
              Clear
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {books.length} of {totalBooks} books
          {search && ` matching "${search}"`}
          {genre && ` in "${genre}" genre`}
        </p>
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No books found</p>
          {state.isAuthenticated && (
            <Link to="/add-book" className="btn-primary mt-4 inline-block">
              Add the first book
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div 
              key={book._id} 
              className="card hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
              onClick={() => handleBookClick(book._id)}
            >
              {book.imageUrl && (
                <div className="aspect-w-16 aspect-h-10">
                  <img
                    src={book.imageUrl}
                    alt={`${book.title} cover`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="card-body">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 hover:text-blue-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-gray-600 mb-2">by {book.author}</p>
                <p className="text-sm text-gray-500 mb-2">{book.genre} • {book.publishedYear}</p>
                <p className="text-gray-700 mb-4 line-clamp-3">
                  {book.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Added by {book.addedBy.name}</span>
                  {book.averageRating !== undefined && (
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">
                        {book.averageRating.toFixed(1)} ({book.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading more books...</p>
        </div>
      )}

      {/* End of Results Message */}
      {!hasMore && books.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">You've reached the end of the list!</p>
        </div>
      )}
    </div>
  );
};

export default BookListPage;
