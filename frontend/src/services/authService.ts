import axios from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types';
import { encryptPassword } from '../utils/encryption';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
};
