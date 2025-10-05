import axios from 'axios';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  ChangePasswordCredentials,
  ForgotPasswordCredentials, 
  ResetPasswordCredentials,
  AuthResponse,
  ForgotPasswordResponse 
} from '../types';
import { encryptPassword } from '../utils/encryption';

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

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Encrypt password before sending to backend
      const encryptedCredentials = {
        ...credentials,
        password: encryptPassword(credentials.password)
      };
      
      const response = await api.post<AuthResponse>('/auth/login', encryptedCredentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      // Encrypt password before sending to backend
      const encryptedCredentials = {
        ...credentials,
        password: encryptPassword(credentials.password)
      };
      
      const response = await api.post<AuthResponse>('/auth/register', encryptedCredentials);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  changePassword: async (credentials: ChangePasswordCredentials): Promise<{ message: string }> => {
    try {
      // Encrypt both passwords before sending to backend
      const encryptedCredentials = {
        currentPassword: encryptPassword(credentials.currentPassword),
        newPassword: encryptPassword(credentials.newPassword)
      };
      
      const response = await api.put<{ message: string }>('/auth/change-password', encryptedCredentials);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  forgotPassword: async (credentials: ForgotPasswordCredentials): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', credentials);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, credentials: ResetPasswordCredentials): Promise<AuthResponse> => {
    try {
      // Encrypt password before sending to backend
      const encryptedCredentials = {
        password: encryptPassword(credentials.password)
      };
      
      const response = await api.put<AuthResponse>(`/auth/reset-password/${token}`, encryptedCredentials);
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};
