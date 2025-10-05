import CryptoJS from 'crypto-js';

// Encryption key - should match frontend key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'BookReviewPlatform2024SecretKey';

export const decryptPassword = (encryptedPassword: string): string => {
  try {
    // Decrypt password received from frontend
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    const plainPassword = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plainPassword) {
      throw new Error('Decryption resulted in empty password');
    }
    
    return plainPassword;
  } catch (error) {
    console.error('Password decryption failed:', error);
    throw new Error('Failed to decrypt password');
  }
};

export const encryptPassword = (password: string): string => {
  try {
    // Encrypt password (for testing purposes)
    const encrypted = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt password');
  }
};
