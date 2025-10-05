import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ForgotPasswordCredentials } from '../types';

const ForgotPasswordPage: React.FC = () => {
  const [formData, setFormData] = useState<ForgotPasswordCredentials>({
    email: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(formData);
      setMessage(response.message);
      
      // For demo purposes - in production, this wouldn't be returned
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Link to="/login" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Login
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Forgot Password</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Enter your email to reset your password</p>
      </div>

      <div className="card">
        <div className="card-body">
          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded">
                {message}
              </div>

              {resetToken && (
                <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
                  <p className="font-semibold mb-2">Demo Reset Token:</p>
                  <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm break-all">
                    {resetToken}
                  </code>
                  <p className="text-xs mt-2">In production, this would be sent via email.</p>
                </div>
              )}

              <div className="space-y-2">
                {resetToken && (
                  <Link 
                    to={`/reset-password/${resetToken}`}
                    className="btn-primary w-full inline-block text-center"
                  >
                    Use Reset Token
                  </Link>
                )}
                <Link to="/login" className="btn-outline w-full text-center">
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
