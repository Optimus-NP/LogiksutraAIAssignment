import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookListPage from './pages/BookListPage';
import BookDetailsPage from './pages/BookDetailsPage';
import AddBookPage from './pages/AddBookPage';
import EditBookPage from './pages/EditBookPage';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const { state } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BookListPage />} />
          <Route path="/books/:id" element={<BookDetailsPage />} />
          <Route 
            path="/login" 
            element={state.isAuthenticated ? <Navigate to="/books" /> : <LoginPage />} 
          />
          <Route 
            path="/register" 
            element={state.isAuthenticated ? <Navigate to="/books" /> : <RegisterPage />} 
          />
          <Route
            path="/add-book"
            element={
              <ProtectedRoute>
                <AddBookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-book/:id"
            element={
              <ProtectedRoute>
                <EditBookPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
