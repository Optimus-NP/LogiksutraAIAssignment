import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { state } = useAuth();

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-primary-600">BookReviews</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover, review, and share your favorite books with the community
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">Discover Books</h3>
            <p className="text-gray-600">
              Browse through our collection of books and find your next great read
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold mb-2">Write Reviews</h3>
            <p className="text-gray-600">
              Share your thoughts and help others discover amazing books
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">Join Community</h3>
            <p className="text-gray-600">
              Connect with fellow book lovers and discuss your favorite reads
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Link to="/books" className="btn-primary text-lg px-8 py-3">
          Browse Books
        </Link>
        {!state.isAuthenticated && (
          <Link to="/register" className="btn-secondary text-lg px-8 py-3">
            Join Now
          </Link>
        )}
      </div>
    </div>
  );
};

export default HomePage;
