import CryptoJS from 'crypto-js';

// Encryption key - in production, this should come from environment or server
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'BookReviewPlatform2024SecretKey';

export const encryptPassword = (password: string): string => {
  try {
    // Encrypt password using AES encryption
    const encrypted = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt password');
  }
};

export const decryptPassword = (encryptedPassword: string): string => {
  try {
    // Decrypt password (for testing purposes - normally done on backend)
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt password');
  }
};
