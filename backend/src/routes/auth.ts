import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { decryptPassword } from '../utils/encryption';

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

export default router;
