import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { decryptPassword } from '../utils/encryption';
import { protect, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const { name, email, password } = req.body;

      // Decrypt password received from frontend
      let plainPassword: string;
      try {
        plainPassword = decryptPassword(password);
      } catch (error) {
        res.status(400).json({ message: 'Invalid password format' });
        return;
      }

      // Validate decrypted password length
      if (plainPassword.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters' });
        return;
      }

      // Check if user exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      // Create user with decrypted password (will be hashed by User model)
      const user = await User.create({
        name,
        email,
        password: plainPassword,
      });

      const token = generateToken(user._id.toString());

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Decrypt password received from frontend
      let plainPassword: string;
      try {
        plainPassword = decryptPassword(password);
      } catch (error) {
        res.status(400).json({ message: 'Invalid password format' });
        return;
      }

      // Check for user
      const user = await User.findOne({ email }).select('+password');

      if (user && (await user.matchPassword(plainPassword))) {
        const token = generateToken(user._id.toString());

        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token,
        });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Decrypt passwords received from frontend
      let plainCurrentPassword: string;
      let plainNewPassword: string;
      
      try {
        plainCurrentPassword = decryptPassword(currentPassword);
        plainNewPassword = decryptPassword(newPassword);
      } catch (error) {
        res.status(400).json({ message: 'Invalid password format' });
        return;
      }

      // Get user with password
      const user = await User.findById(req.user?._id).select('+password');
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Check current password
      const isCurrentPasswordCorrect = await user.matchPassword(plainCurrentPassword);
      if (!isCurrentPasswordCorrect) {
        res.status(400).json({ message: 'Current password is incorrect' });
        return;
      }

      // Update password
      user.password = plainNewPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal if user exists or not
        res.json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
        return;
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // In a real application, you would send an email here
      // For demo purposes, we'll return the token (don't do this in production!)
      res.json({
        message: 'Password reset token generated',
        resetToken: resetToken, // Remove this in production
        // In production: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
router.put(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Validation errors', errors: errors.array() });
        return;
      }

      const { password } = req.body;
      const { token } = req.params;

      // Decrypt password received from frontend
      let plainPassword: string;
      try {
        plainPassword = decryptPassword(password);
      } catch (error) {
        res.status(400).json({ message: 'Invalid password format' });
        return;
      }

      // Get hashed token
      const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        res.status(400).json({ message: 'Invalid or expired reset token' });
        return;
      }

      // Set new password
      user.password = plainPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Generate new JWT token
      const jwtToken = generateToken(user._id.toString());

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: jwtToken,
        message: 'Password reset successful',
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
